import { calculatePaymentTotals } from "@/lib/helpers/payment-totals";
import {
  paymentTotalsInputFromTripRequest,
  type TripRequestPricingFields,
} from "@/lib/helpers/trip-request-pricing";

interface DisplayPayment {
  amount: number;
  currency?: string;
  status: string;
}

/**
 * Recorded transactions, including refunds and disputes, are not current quotes.
 * This preserves the original amount, not settlement or net funds after a refund.
 * No historical line items are stored.
 */
export function getTripCostDisplay(
  trip: TripRequestPricingFields & { payment?: DisplayPayment | null },
) {
  const pax = Math.max(1, trip.pax || 1);
  const payment = trip.payment;
  if (
    payment &&
    [
      "APPROVED",
      "COMPLETED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
      "CHARGEBACK",
      "IN_MEDIATION",
    ].includes(payment.status) &&
    Number.isFinite(payment.amount) &&
    payment.amount >= 0
  ) {
    return {
      breakdown: null,
      currency: payment.currency ?? "USD",
      isEstimate: false,
      perPerson: payment.amount / pax,
      total: payment.amount,
    };
  }
  const input = paymentTotalsInputFromTripRequest(trip, null);
  const totals = input ? calculatePaymentTotals(input) : null;
  return {
    breakdown: totals
      ? {
          base: totals.basePerPax * pax,
          filters: totals.filtersPerPax * pax,
          addons: (totals.addonsPerPax + totals.cancelInsurancePerPax) * pax,
        }
      : null,
    currency: "USD",
    isEstimate: true,
    perPerson: totals?.totalPerPax ?? 0,
    total: totals?.totalTrip ?? 0,
  };
}
