import { describe, expect, it } from "vitest";
import {
  calculatePaymentTotals,
  type PaymentTotalsResult,
} from "@/lib/helpers/payment-totals";
import {
  maxTopUpCents,
  splitInitialShares,
  splitTopUps,
  type TotalsAtPax,
} from "../split-shares";
import type { Filters } from "@/store/slices/journeyStore";

/** USD 1000 per person plus a USD `perTrip` add-on split across the group. */
function stubTotals(perTrip: number): TotalsAtPax {
  return (pax: number): PaymentTotalsResult => {
    const addonsPerPax = perTrip / pax;
    const totalPerPax = 1000 + addonsPerPax;
    return {
      addonsPerPax,
      basePerPax: 1000,
      cancelInsurancePerPax: 0,
      filtersPerPax: 0,
      totalPerPax,
      totalTrip: totalPerPax * pax,
    };
  };
}

const fourFriends = { invitedTravelerIds: ["t1", "t2", "t3"], minors: 0 };

describe("splitInitialShares", () => {
  it("splits a 4-person trip into the organizer share and one share per invitee", () => {
    const split = splitInitialShares(stubTotals(70), fourFriends);
    expect(split.pax).toBe(4);
    expect(split.totalCents).toBe(407000);
    expect(split.shares).toEqual([
      { travelerId: null, amountCents: 101750 },
      { travelerId: "t1", amountCents: 101750 },
      { travelerId: "t2", amountCents: 101750 },
      { travelerId: "t3", amountCents: 101750 },
    ]);
  });

  it("gives the rounding remainder to the organizer", () => {
    const split = splitInitialShares(stubTotals(100), {
      invitedTravelerIds: ["t1", "t2"],
      minors: 0,
    });
    expect(split.totalCents).toBe(310000);
    expect(split.shares.map((s) => s.amountCents)).toEqual([
      103334, 103333, 103333,
    ]);
  });

  it("charges minors' shares to the organizer", () => {
    const split = splitInitialShares(stubTotals(70), {
      invitedTravelerIds: ["t1"],
      minors: 2,
    });
    expect(split.pax).toBe(4);
    expect(split.shares).toEqual([
      { travelerId: null, amountCents: 305250 },
      { travelerId: "t1", amountCents: 101750 },
    ]);
  });

  it("adds up exactly to the checkout amount with real pricing", () => {
    const filters = {
      accommodationType: "indistinto",
      transport: "avion",
      climate: "indistinto",
      maxTravelTime: "sin-limite",
      departPref: "indistinto",
      arrivePref: "indistinto",
      avoidDestinations: [],
    } as unknown as Filters;
    const totalsAt: TotalsAtPax = (pax) =>
      calculatePaymentTotals({
        addons: {
          selected: [
            { id: "car-rental", qty: 3 },
            { id: "cancel-ins", qty: 1 },
          ],
        } as Parameters<typeof calculatePaymentTotals>[0]["addons"],
        basePriceUsd: 733,
        filters,
        logistics: { city: "Córdoba", country: "AR", nights: 3, pax },
      });
    const split = splitInitialShares(totalsAt, {
      invitedTravelerIds: ["t1", "t2"],
      minors: 0,
    });
    const sum = split.shares.reduce((acc, s) => acc + s.amountCents, 0);
    expect(sum).toBe(Math.round(totalsAt(3).totalTrip * 100));
  });

  it("rejects a party without invitees", () => {
    expect(() =>
      splitInitialShares(stubTotals(70), { invitedTravelerIds: [], minors: 0 }),
    ).toThrow("split_requires_invitees");
  });
});

describe("splitTopUps", () => {
  it("owes nothing when everyone paid (4 of 4 travel)", () => {
    const result = splitTopUps(stubTotals(70), fourFriends, ["t1", "t2", "t3"]);
    expect(result.pax).toBe(4);
    expect(result.totalCents).toBe(407000);
    expect(result.topUps.every((t) => t.amountCents === 0)).toBe(true);
  });

  it("re-splits per-trip add-ons when two friends drop (4 → 2)", () => {
    const result = splitTopUps(stubTotals(70), fourFriends, ["t2"]);
    expect(result.pax).toBe(2);
    expect(result.totalCents).toBe(207000);
    expect(result.topUps).toEqual([
      { travelerId: null, amountCents: 1750 },
      { travelerId: "t2", amountCents: 1750 },
    ]);
  });

  it("leaves the organizer owing the whole difference when travelling alone (4 → 1)", () => {
    const result = splitTopUps(stubTotals(70), fourFriends, []);
    expect(result.pax).toBe(1);
    expect(result.topUps).toEqual([{ travelerId: null, amountCents: 5250 }]);
  });

  it("collects exactly the new trip total once top-ups are paid", () => {
    const totalsAt = stubTotals(100);
    const party = { invitedTravelerIds: ["t1", "t2", "t3"], minors: 1 };
    const initial = splitInitialShares(totalsAt, party);
    const result = splitTopUps(totalsAt, party, ["t1", "t3"]);
    const paidBefore = initial.shares
      .filter((s) => s.travelerId !== "t2")
      .reduce((acc, s) => acc + s.amountCents, 0);
    const topUps = result.topUps.reduce((acc, t) => acc + t.amountCents, 0);
    expect(paidBefore + topUps).toBe(result.totalCents);
  });

  it("keeps minors with the organizer after drop-outs", () => {
    const result = splitTopUps(
      stubTotals(70),
      { invitedTravelerIds: ["t1"], minors: 2 },
      [],
    );
    expect(result.pax).toBe(3);
    expect(result.topUps).toEqual([{ travelerId: null, amountCents: 1750 }]);
  });

  it("rejects a payer who was not invited", () => {
    expect(() => splitTopUps(stubTotals(70), fourFriends, ["t9"])).toThrow(
      "split_unknown_traveler",
    );
  });
});

describe("maxTopUpCents", () => {
  it("bounds what an invitee and the organizer can owe after drop-outs", () => {
    expect(maxTopUpCents(stubTotals(70), fourFriends)).toEqual({
      inviteeCents: 1750,
      organizerCents: 5250,
    });
  });

  it("is zero when nothing is priced per trip", () => {
    const max = maxTopUpCents(stubTotals(0), fourFriends);
    expect(max).toEqual({ inviteeCents: 0, organizerCents: 0 });
  });
});
