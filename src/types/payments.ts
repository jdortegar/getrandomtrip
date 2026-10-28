import type { TripDetailRowsTrip } from "@/types/Checkout";

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
  /** Pay-by time formatted on the server in the trip's time zone; null when collection never opened. */
  paymentDeadlineLabel: string | null;
  /** Most the companion may owe on top of their share, in major units of `currency`. */
  maxTopUp: number;
  organizerFirstName: string;
  billingEmail: string;
  billingName: string;
  /** Read-only trip summary (the checkout's detail rows); never the trip's price. */
  trip: TripDetailRowsTrip;
}

/** The viewer's own unpaid top-up on one trip. Never another payer's. */
export interface MyTopUp {
  shareId: string;
  /** Major units of `currency`. */
  amount: number;
  currency: string;
  /** ISO end of the top-up grace period; null for the organizer's remainder (due before the reveal). */
  deadline: string | null;
}
