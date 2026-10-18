import type { PaymentStatus } from "@prisma/client";

/** Payment statuses that count as a completed purchase (promo redemptions, conversions). */
export const SETTLED_PAYMENT_STATUSES: PaymentStatus[] = ["APPROVED", "COMPLETED"];
