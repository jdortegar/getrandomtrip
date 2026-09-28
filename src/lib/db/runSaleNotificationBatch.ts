import { randomUUID } from "node:crypto";
import { Prisma, type SaleNotificationDelivery } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SALE_SEND_TIMEOUT_MS,
  sendSaleNotification,
} from "@/lib/sales/sendSaleNotification";

const LEASE_MS = 60_000;
const MAX_BACKOFF_MS = 86_400_000;
const BUDGET_MS = 20_000;
const TX_OPTIONS = { maxWait: 1_000, timeout: 3_000 };

/** Transactional leases serialize workers; Slack I/O never holds DB locks.
 * A unique lease token prevents an expired worker from completing a newer claim.
 * Delivery is at-least-once: remote acceptance and our sent stamp are not atomic.
 */
export async function runSaleNotificationBatch(paymentId?: string) {
  const started = Date.now();
  const leaseToken = randomUUID();
  const nextAttemptAt = new Date(started + LEASE_MS);
  const jobs = await prisma.$transaction(async (tx) => {
    const due = await tx.$queryRaw<SaleNotificationDelivery[]>(Prisma.sql`
      SELECT * FROM "sale_notification_deliveries"
      WHERE "sentAt" IS NULL AND "nextAttemptAt" <= ${new Date(started)}
      ${paymentId ? Prisma.sql`AND "paymentId" = ${paymentId}` : Prisma.empty}
      ORDER BY "nextAttemptAt", "paymentId" LIMIT 3 FOR UPDATE SKIP LOCKED`);
    for (const job of due) {
      await tx.saleNotificationDelivery.update({
        where: { paymentId: job.paymentId },
        data: {
          leaseToken,
          nextAttemptAt,
          attempts: Math.min(job.attempts + 1, 30),
        },
      });
    }
    return due;
  }, TX_OPTIONS);
  const counts = { claimed: jobs.length, sent: 0, failed: 0 };
  for (const job of jobs) {
    // Leave enough budget for one transport deadline and bounded finalization.
    // Unprocessed claims recover automatically when their lease expires.
    if (Date.now() - started > BUDGET_MS - SALE_SEND_TIMEOUT_MS - 4_000) break;
    const result = await sendSaleNotification(job);
    const delay = Math.max(
      Math.min(MAX_BACKOFF_MS, 60_000 * 2 ** Math.min(job.attempts, 11)),
      result.retryAfterMs ?? 0,
    );
    const completed = await prisma.$transaction(
      (tx) =>
        tx.saleNotificationDelivery.updateMany({
          where: { paymentId: job.paymentId, leaseToken, sentAt: null },
          data: {
            leaseToken: null,
            sentAt: result.sent ? new Date() : null,
            nextAttemptAt: new Date(Date.now() + delay),
            lastError: result.sent ? null : (result.error ?? "unavailable"),
          },
        }),
      TX_OPTIONS,
    );
    if (completed.count) {
      if (result.sent) counts.sent++;
      else counts.failed++;
    }
  }
  if (counts.failed) console.warn("[sales] delivery retry pending", counts);
  return counts;
}
