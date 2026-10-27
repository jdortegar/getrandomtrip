import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Outcomes a later, duplicate, or out-of-order event must never reverse. */
const SETTLED_SHARE_STATUSES: PaymentStatus[] = [
  "APPROVED",
  "COMPLETED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "CHARGEBACK",
];

/**
 * Applies a Stripe outcome to the companion share that holds `intentId`.
 * Returns false when no share holds it (a replaced or unknown intent). A paid
 * share is never moved back by a replayed or stale event.
 */
export async function settleShareFromStripe(
  intentId: string,
  status: PaymentStatus,
  paidAt?: Date,
): Promise<boolean> {
  const share = await prisma.paymentShare.findUnique({
    where: { stripePaymentIntentId: intentId },
    select: { id: true },
  });
  if (!share) return false;
  await prisma.paymentShare.updateMany({
    where: {
      id: share.id,
      stripePaymentIntentId: intentId,
      status: { notIn: SETTLED_SHARE_STATUSES },
    },
    data: {
      status,
      ...(status === "APPROVED" ? { paidAt: paidAt ?? new Date() } : {}),
    },
  });
  return true;
}
