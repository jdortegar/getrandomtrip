/**
 * Server-only Stripe promotion code lookup for campaigns
 * (odd/tasks/email-campaigns.md, decision 5). Codes are created in the
 * Stripe dashboard; the admin types one and we show its rules back.
 */
import type Stripe from "stripe";

import { SETTLED_PAYMENT_STATUSES } from "@/lib/payments/settledStatuses";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type {
  CampaignEmailPromo,
  CampaignLocale,
  PromotionCodeSummary,
} from "@/types/emailCampaign";

const toIso = (seconds: number | null | undefined) =>
  seconds ? new Date(seconds * 1000).toISOString() : null;

function earliest(...seconds: (number | null | undefined)[]): number | null {
  const values = seconds.filter((value): value is number => !!value);
  return values.length ? Math.min(...values) : null;
}

/** Checkout uppercases typed codes; lookups follow the same rule. */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function lookupPromotionCode(
  rawCode: string,
): Promise<PromotionCodeSummary | null> {
  const code = normalizePromoCode(rawCode);
  if (!code) return null;

  const stripe = getStripe();
  const promotion = (await stripe.promotionCodes.list({ code, limit: 1 }))
    .data[0];
  if (!promotion) return null;

  const ref = promotion.promotion.coupon;
  if (!ref) return null;
  const coupon =
    typeof ref === "string" ? await stripe.coupons.retrieve(ref) : ref;

  const restrictions: Partial<Stripe.PromotionCode.Restrictions> =
    promotion.restrictions ?? {};
  const redemptionsUsed = await prisma.payment.count({
    where: {
      stripePromotionCodeId: promotion.id,
      status: { in: SETTLED_PAYMENT_STATUSES },
    },
  });

  return {
    id: promotion.id,
    code: promotion.code,
    active: promotion.active && coupon.valid,
    percentOff: coupon.percent_off ?? null,
    amountOffCents: coupon.amount_off ?? null,
    currency: coupon.currency ?? null,
    expiresAt: toIso(earliest(promotion.expires_at, coupon.redeem_by)),
    maxRedemptions: promotion.max_redemptions ?? null,
    redemptionsUsed,
    firstTimeOnly: Boolean(restrictions.first_time_transaction),
    minimumAmountCents: restrictions.minimum_amount ?? null,
  };
}

/** Customer-facing discount, e.g. `30% off` / `30% de descuento`. */
export function discountLabel(
  summary: Pick<PromotionCodeSummary, "percentOff" | "amountOffCents" | "currency">,
  locale: CampaignLocale,
): string {
  const suffix = locale === "en" ? "off" : "de descuento";
  const intlLocale = locale === "en" ? "en-US" : "es-AR";
  if (summary.percentOff != null) {
    const percent = new Intl.NumberFormat(intlLocale, {
      maximumFractionDigits: 2,
    }).format(summary.percentOff);
    return `${percent}% ${suffix}`;
  }
  const amount = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: (summary.currency ?? "usd").toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((summary.amountOffCents ?? 0) / 100);
  return `${amount} ${suffix}`;
}

export function toEmailPromo(
  summary: PromotionCodeSummary,
  locale: CampaignLocale,
): CampaignEmailPromo {
  return {
    code: summary.code,
    discountLabel: discountLabel(summary, locale),
    expiresAt: summary.expiresAt,
  };
}
