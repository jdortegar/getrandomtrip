/** Why checkout refused a Stripe promotion code whose rules we enforce in-house. */
export type PromoRejectionReason =
  | "expired"
  | "max_redemptions_reached"
  | "already_used"
  | "first_time_only"
  | "minimum_amount";

/** API `errorCode` for a promo rejection, e.g. `PROMO_ALREADY_USED`. */
export type PromoErrorCode = `PROMO_${Uppercase<PromoRejectionReason>}`;
