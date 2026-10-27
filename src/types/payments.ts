/** Why checkout refused a Stripe promotion code whose rules we enforce in-house. */
export type PromoRejectionReason =
  | "expired"
  | "max_redemptions_reached"
  | "already_used"
  | "first_time_only"
  | "minimum_amount";

/** API `errorCode` for a promo rejection, e.g. `PROMO_ALREADY_USED`. */
export type PromoErrorCode = `PROMO_${Uppercase<PromoRejectionReason>}`;

/** What the companion share checkout shows: pay now, already paid, or closed. */
export type ShareCheckoutState = "pay" | "paid" | "closed";

/** Server-resolved view of one companion's share. */
export interface ShareCheckoutView {
  travelerId: string;
  state: ShareCheckoutState;
  /** Major units of `currency` (e.g. 1023.33 = USD 1,023.33). */
  amount: number;
  currency: string;
  /** ISO timestamp; null when the trip never opened collection. */
  paymentDeadline: string | null;
  organizerFirstName: string;
  billingEmail: string;
  billingName: string;
}
