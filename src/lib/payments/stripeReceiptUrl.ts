import { getStripe } from "@/lib/stripe";

/**
 * Stripe's hosted receipt for a PaymentIntent's latest charge (the page has
 * its own "Download receipt" PDF action). Null when the intent is missing,
 * has no charge yet, or Stripe can't be reached — callers hide the action.
 */
export async function getStripeReceiptUrl(intentId: string | null): Promise<string | null> {
  if (!intentId) return null;
  try {
    const pi = await getStripe().paymentIntents.retrieve(intentId, { expand: ["latest_charge"] });
    const charge = pi.latest_charge;
    if (charge && typeof charge === "object" && "receipt_url" in charge) {
      return (charge as { receipt_url: string | null }).receipt_url;
    }
  } catch {
    // Non-fatal: no receipt to show.
  }
  return null;
}
