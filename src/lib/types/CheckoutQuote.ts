import type { PaymentTotalsResult } from "@/lib/helpers/payment-totals";
import type { PaxDetails } from "@/lib/types/PaxDetails";

/** How the buyer pays; INDIVIDUAL lists one email per adult companion. */
export interface CheckoutPaymentSplit {
  paymentMode: "TOTAL" | "INDIVIDUAL";
  companionEmails?: string[];
}

export interface CheckoutQuote {
  clientSecret: string;
  paymentIntentId: string;
  code: string | null;
  discountAmount: number;
  total: number;
  totals: PaymentTotalsResult;
  paxDetails: PaxDetails;
  level: string;
  paymentMode?: "TOTAL" | "INDIVIDUAL";
  /** Discounted trip bill (USD); `total` is what is charged now. */
  tripTotal?: number;
  /** INDIVIDUAL only. Amounts in USD. */
  split?: {
    companionEmails: string[];
    companionShare: number;
    maxTopUp: { invitee: number; organizer: number };
  };
}
