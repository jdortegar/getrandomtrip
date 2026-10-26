import type { PaymentTotalsResult } from "@/lib/helpers/payment-totals";

/**
 * Totals for the same trip at a given headcount. The caller builds it from
 * `calculatePaymentTotals` with every pax-dependent input (e.g. the PAWS
 * multiplier on the base price) recomputed for that `pax`.
 */
export type TotalsAtPax = (pax: number) => PaymentTotalsResult;

/** Who is splitting an INDIVIDUAL trip; the organizer is implicit. */
export interface SplitParty {
  /** Adult companion `TripTraveler` ids invited to pay their own share. */
  invitedTravelerIds: string[];
  /** Minors travel on the organizer's bill. */
  minors: number;
}

export interface ShareLine {
  /** null = the organizer. */
  travelerId: string | null;
  /** USD cents. */
  amountCents: number;
}

export interface InitialSplit {
  pax: number;
  /** USD cents; equals the sum of `shares`. */
  totalCents: number;
  /** Organizer first, then invitees in input order. */
  shares: ShareLine[];
}

export interface TopUpSplit {
  /** Headcount after unpaid invitees are dropped. */
  pax: number;
  /** USD cents for the trip at the new headcount. */
  totalCents: number;
  /** Organizer first, then paying invitees in input order. */
  topUps: ShareLine[];
}

/** Promo applied to the whole trip, as checkout reads it from the Stripe coupon. */
export interface TripDiscount {
  percentOff?: number;
  amountOffUsd?: number;
}

/**
 * Applies the organizer's promo to the trip total at every headcount, so the
 * discount is split evenly across all shares and top-ups stay discounted.
 */
export function withTripDiscount(
  totalsAt: TotalsAtPax,
  discount: TripDiscount,
): TotalsAtPax {
  return (pax) => {
    const totals = totalsAt(pax);
    const off = discount.percentOff
      ? (totals.totalTrip * discount.percentOff) / 100
      : (discount.amountOffUsd ?? 0);
    const totalTrip = totals.totalTrip - Math.min(off, totals.totalTrip);
    return { ...totals, totalPerPax: totalTrip / pax, totalTrip };
  };
}

/** Same rounding checkout uses for the Stripe amount. */
function toCents(usd: number): number {
  return Math.round(usd * 100);
}

function paxFor(party: SplitParty, invitees: number): number {
  return 1 + invitees + party.minors;
}

/** Per-invitee share and organizer share (minors + rounding) at a headcount. */
function sharesAt(totalsAt: TotalsAtPax, pax: number, invitees: number) {
  const totals = totalsAt(pax);
  const totalCents = toCents(totals.totalTrip);
  const inviteeCents = toCents(totals.totalPerPax);
  return {
    inviteeCents,
    organizerCents: totalCents - inviteeCents * invitees,
    totalCents,
  };
}

function assertInvitees(party: SplitParty) {
  if (party.invitedTravelerIds.length === 0) {
    throw new Error("split_requires_invitees");
  }
}

/** Shares charged at checkout, before anyone drops out. */
export function splitInitialShares(
  totalsAt: TotalsAtPax,
  party: SplitParty,
): InitialSplit {
  assertInvitees(party);
  const invitees = party.invitedTravelerIds.length;
  const pax = paxFor(party, invitees);
  const at = sharesAt(totalsAt, pax, invitees);
  return {
    pax,
    totalCents: at.totalCents,
    shares: [
      { travelerId: null, amountCents: at.organizerCents },
      ...party.invitedTravelerIds.map((travelerId) => ({
        travelerId,
        amountCents: at.inviteeCents,
      })),
    ],
  };
}

/**
 * Top-ups owed once the deadline drops unpaid invitees: each payer's share at
 * the new headcount minus what they already paid, never negative.
 */
export function splitTopUps(
  totalsAt: TotalsAtPax,
  party: SplitParty,
  paidTravelerIds: string[],
): TopUpSplit {
  assertInvitees(party);
  const invited = new Set(party.invitedTravelerIds);
  if (paidTravelerIds.some((id) => !invited.has(id))) {
    throw new Error("split_unknown_traveler");
  }
  const paid = party.invitedTravelerIds.filter((id) =>
    paidTravelerIds.includes(id),
  );
  const before = sharesAt(
    totalsAt,
    paxFor(party, party.invitedTravelerIds.length),
    party.invitedTravelerIds.length,
  );
  const pax = paxFor(party, paid.length);
  const after = sharesAt(totalsAt, pax, paid.length);
  return {
    pax,
    totalCents: after.totalCents,
    topUps: [
      {
        travelerId: null,
        amountCents: Math.max(0, after.organizerCents - before.organizerCents),
      },
      ...paid.map((travelerId) => ({
        travelerId,
        amountCents: Math.max(0, after.inviteeCents - before.inviteeCents),
      })),
    ],
  };
}

/**
 * Worst-case extra charge shown in the disclaimer. The organizer's figure
 * includes the invitee top-ups they cover if nobody pays them.
 */
export function maxTopUpCents(
  totalsAt: TotalsAtPax,
  party: SplitParty,
): { inviteeCents: number; organizerCents: number } {
  assertInvitees(party);
  let inviteeCents = 0;
  let organizerCents = 0;
  for (let k = 0; k <= party.invitedTravelerIds.length; k++) {
    const paid = party.invitedTravelerIds.slice(0, k);
    const { topUps } = splitTopUps(totalsAt, party, paid);
    const [organizer, ...invitees] = topUps;
    const inviteeTopUp = invitees[0]?.amountCents ?? 0;
    inviteeCents = Math.max(inviteeCents, inviteeTopUp);
    organizerCents = Math.max(
      organizerCents,
      organizer.amountCents + inviteeTopUp * invitees.length,
    );
  }
  return { inviteeCents, organizerCents };
}
