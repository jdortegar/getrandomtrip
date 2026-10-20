/**
 * Campaign metrics and conversion attribution (admin only).
 *
 * A conversion is a settled payment made with the campaign's Stripe promotion
 * code on or after the campaign was sent. It is *attributed* when the payer is
 * a recipient of the campaign — the payment's user is the contact's linked
 * user, or the payer's account email matches the send / contact email
 * (case-insensitive) — and *shared* otherwise (the code was passed along).
 *
 * Caveats: two campaigns sharing one promotion code both count the same
 * payment; revenue is reported in USD (checkout charges USD only) and other
 * currencies are counted as conversions but kept out of `revenue`.
 */
import type {
  CampaignSendStatus as PrismaCampaignSendStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { SETTLED_PAYMENT_STATUSES } from "@/lib/payments/settledStatuses";
import type {
  CampaignConversionCounts,
  CampaignMetrics,
  CampaignRecipient,
  CampaignReport,
  CampaignSendStatus,
  CampaignSummary,
} from "@/types/emailCampaign";

/** Currency `revenue` is reported in; checkout PaymentIntents are always USD. */
const REVENUE_CURRENCY = "USD";

/** Send statuses the provider accepted, matching `CampaignSendSummary.sent`. */
const ACCEPTED_STATUSES: PrismaCampaignSendStatus[] = ["SENT", "DELIVERED", "BOUNCED"];

type CampaignRef = {
  id: string;
  stripePromotionCodeId: string | null;
  sentAt: Date | null;
};

type ConversionPayment = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paidAt: Date | null;
  stripePromotionCodeId: string | null;
  user: { email: string };
};

/** A conversion loaded with its discount sources (report path only). */
type DiscountedConversionPayment = ConversionPayment & {
  promoDiscountUsd: number | null;
  providerResponse: unknown;
  webhookData: unknown;
};

type RecipientIdentity = {
  email: string;
  contact: { email: string; userId: string | null };
};

const campaignRefSelect = {
  id: true,
  stripePromotionCodeId: true,
  sentAt: true,
} as const;

const roundCents = (value: number) => Math.round(value * 100) / 100;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

/**
 * Reads the checkout discount (`discountAmountUsd`, major USD units) from a
 * stored PaymentIntent JSON: either the intent itself (`metadata`) or a Stripe
 * event wrapping it (`data.object.metadata`). `null` for any other shape.
 */
export function readDiscountAmountUsd(json: unknown): number | null {
  const root = asRecord(json);
  if (!root) return null;
  const wrapped = asRecord(asRecord(root.data)?.object);
  for (const holder of [root, wrapped]) {
    const metadata = asRecord(holder?.metadata);
    const amount = parseAmount(metadata?.discountAmountUsd);
    if (amount !== null) return amount;
  }
  return null;
}

/**
 * The persisted `promoDiscountUsd` column wins; rows settled before it existed
 * fall back to the discount in the stored Stripe JSON, when there is any.
 */
function paymentDiscount(payment: DiscountedConversionPayment): number | null {
  return (
    payment.promoDiscountUsd ??
    readDiscountAmountUsd(payment.webhookData) ??
    readDiscountAmountUsd(payment.providerResponse)
  );
}

function isRevenueCurrency(payment: { currency: string }): boolean {
  return payment.currency.toUpperCase() === REVENUE_CURRENCY;
}

function sumRevenue(payments: { amount: number; currency: string }[]): number {
  return roundCents(
    payments.filter(isRevenueCurrency).reduce((sum, p) => sum + p.amount, 0),
  );
}

/** Conversions are only measurable for a sent campaign with a promotion code. */
function tracksConversions(
  campaign: CampaignRef,
): campaign is CampaignRef & { stripePromotionCodeId: string; sentAt: Date } {
  return Boolean(campaign.stripePromotionCodeId && campaign.sentAt);
}

const conversionSelect = {
  id: true,
  userId: true,
  amount: true,
  currency: true,
  paidAt: true,
  stripePromotionCodeId: true,
  user: { select: { email: true } },
} satisfies Prisma.PaymentSelect;

/** Settled payments with the given codes; the per-campaign `sentAt` cut-off is applied by callers. */
function settledPromoPaymentsWhere(promotionCodeIds: string[]) {
  return {
    stripePromotionCodeId: { in: promotionCodeIds },
    status: { in: SETTLED_PAYMENT_STATUSES },
    paidAt: { not: null },
  } satisfies Prisma.PaymentWhereInput;
}

/** Summaries never report discounts, so they never load the Stripe JSON columns. */
function findSettledPromoPayments(promotionCodeIds: string[]): Promise<ConversionPayment[]> {
  return prisma.payment.findMany({
    where: settledPromoPaymentsWhere(promotionCodeIds),
    select: conversionSelect,
  });
}

/**
 * Same payments plus their discount sources, for the single-campaign report:
 * `promoDiscountUsd` and the Stripe JSON columns that back the fallback for
 * older rows (bounded by one campaign's conversions).
 */
function findSettledDiscountedPromoPayments(
  promotionCodeIds: string[],
): Promise<DiscountedConversionPayment[]> {
  return prisma.payment.findMany({
    where: settledPromoPaymentsWhere(promotionCodeIds),
    select: {
      ...conversionSelect,
      promoDiscountUsd: true,
      providerResponse: true,
      webhookData: true,
    },
  });
}

function paidAfterSend(campaign: CampaignRef, payment: { paidAt: Date | null; stripePromotionCodeId: string | null }) {
  return (
    payment.stripePromotionCodeId === campaign.stripePromotionCodeId &&
    payment.paidAt !== null &&
    campaign.sentAt !== null &&
    payment.paidAt >= campaign.sentAt
  );
}

/** Index of recipients by linked user id and lowercase email. */
function recipientMatcher<T extends RecipientIdentity>(recipients: T[]) {
  const byUserId = new Map<string, T>();
  const byEmail = new Map<string, T>();
  for (const recipient of recipients) {
    if (recipient.contact.userId) byUserId.set(recipient.contact.userId, recipient);
    byEmail.set(recipient.email.toLowerCase(), recipient);
    byEmail.set(recipient.contact.email.toLowerCase(), recipient);
  }
  return (payment: ConversionPayment): T | undefined =>
    byUserId.get(payment.userId) ?? byEmail.get(payment.user.email.toLowerCase());
}

const recipientSelect = {
  id: true,
  email: true,
  status: true,
  sentAt: true,
  contact: { select: { name: true, email: true, userId: true } },
  // At most one row per tracked type: enough to answer "did it happen".
  events: {
    where: { type: { in: ["DELIVERED", "OPENED", "CLICKED"] } },
    select: { type: true },
    distinct: ["type"],
  },
} satisfies Prisma.CampaignSendSelect;

/**
 * Loads a campaign's metrics and recipient table with one send query and at
 * most one payment query. `null` for an unknown campaign.
 */
export async function getCampaignReport(
  campaignId: string,
): Promise<CampaignReport | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: campaignRefSelect,
  });
  if (!campaign) return null;

  const sends = await prisma.campaignSend.findMany({
    where: { campaignId },
    orderBy: { email: "asc" },
    select: recipientSelect,
  });

  const payments = tracksConversions(campaign)
    ? (await findSettledDiscountedPromoPayments([campaign.stripePromotionCodeId])).filter(
        (payment) => paidAfterSend(campaign, payment),
      )
    : [];

  const matchRecipient = recipientMatcher(sends);
  const purchasedSendIds = new Set<string>();
  const conversions: CampaignConversionCounts = { attributed: 0, shared: 0 };
  for (const payment of payments) {
    const recipient = matchRecipient(payment);
    if (recipient) {
      conversions.attributed += 1;
      purchasedSendIds.add(recipient.id);
    } else {
      conversions.shared += 1;
    }
  }

  const discounts = payments
    .map(paymentDiscount)
    .filter((amount): amount is number => amount !== null);

  const has = (send: (typeof sends)[number], type: string) =>
    send.events.some((event) => event.type === type);
  const countWhere = (predicate: (send: (typeof sends)[number]) => boolean) =>
    sends.filter(predicate).length;

  const metrics: CampaignMetrics = {
    sent: countWhere((s) => ACCEPTED_STATUSES.includes(s.status)),
    delivered: countWhere((s) => s.status === "DELIVERED" || has(s, "DELIVERED")),
    bounced: countWhere((s) => s.status === "BOUNCED"),
    failed: countWhere((s) => s.status === "FAILED" || s.status === "QUEUED"),
    uniqueOpens: countWhere((s) => has(s, "OPENED")),
    uniqueClicks: countWhere((s) => has(s, "CLICKED")),
    conversions,
    revenue: sumRevenue(payments),
    discountTotal: discounts.length
      ? roundCents(discounts.reduce((sum, amount) => sum + amount, 0))
      : null,
    currency: REVENUE_CURRENCY,
    otherCurrencyConversions: payments.filter((p) => !isRevenueCurrency(p)).length,
  };

  const recipients: CampaignRecipient[] = sends.map((send) => ({
    sendId: send.id,
    email: send.email,
    name: send.contact.name,
    status: send.status as CampaignSendStatus,
    opened: has(send, "OPENED"),
    clicked: has(send, "CLICKED"),
    purchased: purchasedSendIds.has(send.id),
    sentAt: send.sentAt?.toISOString() ?? null,
  }));

  return { metrics, recipients };
}

export async function getCampaignMetrics(
  campaignId: string,
): Promise<CampaignMetrics | null> {
  return (await getCampaignReport(campaignId))?.metrics ?? null;
}

export async function getCampaignRecipients(
  campaignId: string,
): Promise<CampaignRecipient[] | null> {
  return (await getCampaignReport(campaignId))?.recipients ?? null;
}

function countByCampaign(groups: { campaignId: string; _count: { _all: number } }[]) {
  const counts = new Map<string, number>();
  for (const group of groups) {
    counts.set(group.campaignId, (counts.get(group.campaignId) ?? 0) + group._count._all);
  }
  return counts;
}

function sendsWithEvent(type: "OPENED" | "CLICKED") {
  return prisma.campaignSend.groupBy({
    by: ["campaignId"],
    where: { events: { some: { type } } },
    _count: { _all: true },
  });
}

/**
 * List / comparison figures for every campaign, from three grouped send
 * queries and at most one payment query, independent of recipient count.
 */
export async function getCampaignSummaries(): Promise<CampaignSummary[]> {
  const [campaigns, accepted, opened, clicked] = await Promise.all([
    prisma.campaign.findMany({ select: campaignRefSelect, orderBy: { createdAt: "desc" } }),
    prisma.campaignSend.groupBy({
      by: ["campaignId"],
      where: { status: { in: ACCEPTED_STATUSES } },
      _count: { _all: true },
    }),
    sendsWithEvent("OPENED"),
    sendsWithEvent("CLICKED"),
  ]);

  const promoCampaigns = campaigns.filter(tracksConversions);
  const promotionCodeIds = [
    ...new Set(promoCampaigns.map((campaign) => campaign.stripePromotionCodeId)),
  ];
  const payments = promotionCodeIds.length
    ? await findSettledPromoPayments(promotionCodeIds)
    : [];

  const sentCounts = countByCampaign(accepted);
  const openCounts = countByCampaign(opened);
  const clickCounts = countByCampaign(clicked);

  return campaigns.map((campaign) => {
    const conversions = tracksConversions(campaign)
      ? payments.filter((payment) => paidAfterSend(campaign, payment))
      : [];
    return {
      id: campaign.id,
      sent: sentCounts.get(campaign.id) ?? 0,
      uniqueOpens: openCounts.get(campaign.id) ?? 0,
      uniqueClicks: clickCounts.get(campaign.id) ?? 0,
      conversions: conversions.length,
      revenue: sumRevenue(conversions),
    };
  });
}
