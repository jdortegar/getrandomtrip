import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminRecipients } from "@/lib/email/getAdminRecipients";
import {
  buildAssignmentReminderEmail,
  getAssignmentReminderNotification,
} from "@/lib/email/sendDestinationAssignmentReminder";
import { getAssignmentReminderWindow } from "@/lib/helpers/getAssignmentReminderWindow";
import { getRevealAt } from "@/lib/helpers/getRevealCountdown";

const PAGE_SIZE = 25;
const identity = (parts: (string | number)[]) =>
  createHash("sha256").update(JSON.stringify(parts)).digest("hex");

/** Materialize only the current milestone; unique keys preserve the first payload. */
export async function queueAssignmentReminders(
  clock: () => Date,
  budgetEndsAt: number,
) {
  const recipients = await getAdminRecipients();
  const admins = await prisma.user.findMany({
    where: { roles: { has: "ADMIN" } },
    select: { id: true, locale: true },
  });
  let queued = 0;
  let cursor: string | undefined;
  while (Date.now() < budgetEndsAt) {
    const now = clock();
    // Derive departure bounds from the shared reveal offset, not a second 48h constant.
    const revealOffset = -getRevealAt(new Date(0)).getTime();
    const trips = await prisma.tripRequest.findMany({
      where: {
        status: "CONFIRMED",
        experienceId: null,
        startDate: {
          gt: new Date(+now + revealOffset),
          lte: new Date(+now + revealOffset + 72 * 3_600_000),
        },
      },
      select: { id: true, startDate: true, user: { select: { name: true } } },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    for (const trip of trips) {
      if (Date.now() >= budgetEndsAt) return queued;
      const window = getAssignmentReminderWindow(trip.startDate, clock());
      if (!window) continue;
      const parts = [
        trip.id,
        window.revealAt.toISOString(),
        window.milestoneHours,
      ];
      const existing = await prisma.destinationAssignmentDelivery.findMany({
        where: {
          tripRequestId: trip.id,
          revealAt: window.revealAt,
          milestoneHours: window.milestoneHours,
        },
        select: { recipientEmail: true },
      });
      const missing = recipients.filter(
        (recipient) =>
          !existing.some((row) => row.recipientEmail === recipient.email),
      );
      const deliveries: Prisma.DestinationAssignmentDeliveryCreateManyInput[] =
        [];
      for (const recipient of missing) {
        const payload = await buildAssignmentReminderEmail({
          tripId: trip.id,
          clientName: trip.user.name,
          recipient,
          window,
        });
        deliveries.push({
          id: identity(["email", ...parts, recipient.email]),
          tripRequestId: trip.id,
          ...window,
          ...payload,
          nextAttemptAt: clock(),
        });
      }
      const notices = admins.map((admin) => ({
        id: identity(["notice", ...parts, admin.id]),
        userId: admin.id,
        type: "BOOKING_CONFIRMED" as const,
        audience: "ADMIN" as const,
        ...getAssignmentReminderNotification({
          tripId: trip.id,
          clientName: trip.user.name,
          locale: admin.locale,
          window,
        }),
        metadata: {
          tripRequestId: trip.id,
          milestoneHours: window.milestoneHours,
          revealAt: window.revealAt.toISOString(),
        },
      }));
      queued += await prisma.$transaction(async (tx) => {
        const current = await tx.tripRequest.findFirst({
          where: {
            id: trip.id,
            status: "CONFIRMED",
            experienceId: null,
            startDate: { equals: trip.startDate! },
          },
          select: { startDate: true },
        });
        if (
          !current ||
          getAssignmentReminderWindow(current.startDate, clock())
            ?.milestoneHours !== window.milestoneHours
        )
          return 0;
        for (const notice of notices) {
          // The marker survives inbox deletion. Its first insert and the inbox row
          // commit together, so concurrent polls cannot recreate dismissed notices.
          const marker = await tx.destinationAssignmentNotice.createMany({
            data: [
              {
                id: notice.id,
                tripRequestId: trip.id,
                revealAt: window.revealAt,
                milestoneHours: window.milestoneHours,
                adminUserId: notice.userId,
              },
            ],
            skipDuplicates: true,
          });
          if (marker.count)
            await tx.notification.createMany({
              data: [notice],
              skipDuplicates: true,
            });
        }
        return deliveries.length
          ? (
              await tx.destinationAssignmentDelivery.createMany({
                data: deliveries,
                skipDuplicates: true,
              })
            ).count
          : 0;
      });
    }
    if (trips.length < PAGE_SIZE) break;
    cursor = trips[trips.length - 1].id;
  }
  return queued;
}
