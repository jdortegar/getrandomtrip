import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";

interface CheckoutPayment {
  status: string;
  stripePaymentIntentId: string | null;
}

/** Changed pricing inputs must never leave their previous payable intent alive.
 * Cancel before the guarded DB write; if confirmation won the race, reject
 * the edit instead of attaching a new party to an already-running payment. */
export async function invalidateCheckoutForEdit(
  payment: CheckoutPayment | null,
  priceChanged = true,
) {
  if (!payment) return;
  const conflict = () =>
    Object.assign(
      new Error("Payment already in progress; checkout cannot be changed"),
      { status: 409 },
    );
  if (
    !(RETRYABLE_PAYMENT_STATUSES as readonly string[]).includes(payment.status)
  )
    throw conflict();
  if (!payment.stripePaymentIntentId) return;
  const stripe = getStripe();
  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId,
    );
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeInvalidRequestError &&
      error.code === "resource_missing"
    )
      return;
    throw conflict();
  }
  if (intent.status === "canceled") return;
  if (
    !["requires_payment_method", "requires_confirmation"].includes(
      intent.status,
    )
  )
    throw conflict();
  if (priceChanged) {
    try {
      await stripe.paymentIntents.cancel(intent.id);
    } catch {
      throw conflict();
    }
  }
}
