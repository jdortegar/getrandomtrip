import type { PromoErrorCode, PromoRejectionReason } from "@/types/payments";

/** The subset of Stripe's PromotionCode/Coupon that checkout enforces. Checkout
 * uses PaymentIntents, so Stripe never redeems codes and never applies these. */
export interface PromoRuleInput {
  /** Pre-discount charge in the smallest unit of `currency` (USD cents). */
  amountCents: number;
  /** Settled payments, on other trips, that used this promotion code. */
  codeRedemptions: number;
  coupon: { redeem_by: number | null };
  /** Lowercase ISO code of the checkout charge, e.g. `usd`. */
  currency: string;
  nowSeconds: number;
  promotion: {
    /** Unix seconds. */
    expires_at: number | null;
    max_redemptions: number | null;
    restrictions: {
      currency_options?: Record<string, { minimum_amount: number }>;
      first_time_transaction: boolean;
      /** Smallest currency unit of `minimum_amount_currency`. */
      minimum_amount: number | null;
      minimum_amount_currency: string | null;
    };
  };
  /** The buyer's settled payments, on other trips, that used this code. */
  userCodeUses: number;
  /** The buyer's settled payments on other trips, with or without a code. */
  userSettledPayments: number;
}

export type PromoRuleResult =
  | { ok: true }
  | { ok: false; reason: PromoRejectionReason };

/** Minimum amount in the checkout currency, or null when the code has none. */
function minimumInCurrency(
  restrictions: PromoRuleInput["promotion"]["restrictions"],
  currency: string,
): number | null {
  if (restrictions.minimum_amount == null) return null;
  if (restrictions.minimum_amount_currency?.toLowerCase() === currency) {
    return restrictions.minimum_amount;
  }
  // A minimum set only in another currency cannot be compared, so the code
  // does not apply to this charge (fail closed, as Stripe would).
  return restrictions.currency_options?.[currency]?.minimum_amount ?? Infinity;
}

/** Evaluates promotion code rules; the first broken rule is the reason. */
export function evaluatePromoRules(input: PromoRuleInput): PromoRuleResult {
  const { coupon, promotion, nowSeconds } = input;
  const reject = (reason: PromoRejectionReason): PromoRuleResult => ({
    ok: false,
    reason,
  });
  if (
    (promotion.expires_at != null && promotion.expires_at <= nowSeconds) ||
    (coupon.redeem_by != null && coupon.redeem_by <= nowSeconds)
  ) {
    return reject("expired");
  }
  if (
    promotion.max_redemptions != null &&
    input.codeRedemptions >= promotion.max_redemptions
  ) {
    return reject("max_redemptions_reached");
  }
  if (input.userCodeUses > 0) return reject("already_used");
  if (
    promotion.restrictions.first_time_transaction &&
    input.userSettledPayments > 0
  ) {
    return reject("first_time_only");
  }
  const minimum = minimumInCurrency(promotion.restrictions, input.currency);
  if (minimum != null && input.amountCents < minimum) {
    return reject("minimum_amount");
  }
  return { ok: true };
}

const PROMO_REASONS: readonly PromoRejectionReason[] = [
  "expired",
  "max_redemptions_reached",
  "already_used",
  "first_time_only",
  "minimum_amount",
];

export function promoErrorCode(reason: PromoRejectionReason): PromoErrorCode {
  return `PROMO_${reason.toUpperCase()}` as PromoErrorCode;
}

/** Maps an API `errorCode` back to its promo reason, or null for other errors. */
export function promoReasonFromErrorCode(
  errorCode: string | null | undefined,
): PromoRejectionReason | null {
  return (
    PROMO_REASONS.find((reason) => promoErrorCode(reason) === errorCode) ??
    null
  );
}
