import type { PaymentTotalsResult } from "@/lib/helpers/payment-totals";
import type { PaxDetails } from "@/lib/types/PaxDetails";

export interface CheckoutQuote {
  clientSecret: string;
  paymentIntentId: string;
  code: string | null;
  discountAmount: number;
  total: number;
  totals: PaymentTotalsResult;
  paxDetails: PaxDetails;
  level: string;
}
