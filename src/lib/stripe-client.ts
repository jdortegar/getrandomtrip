import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/** Reuse a healthy/pending instance, but allow an explicit retry after load failure. */
export function getStripePromise(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (
    !key ||
    (process.env.NEXT_PUBLIC_RT_DEPLOY_ENV !== "production" &&
      !key.startsWith("pk_test_"))
  ) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key)
      .then((stripe) => {
        if (!stripe) stripePromise = null;
        return stripe;
      })
      .catch(() => {
        stripePromise = null;
        // Elements accepts null; the form's readiness timeout provides localized
        // recovery without an unhandled promise rejection from its provider.
        return null;
      });
  }
  return stripePromise;
}
