import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deliverDestinationRevealedEmail } from "@/lib/email";
import { getDepartureAt } from "@/lib/helpers/getRevealCountdown";
import { ZONE_QUERY_MARGIN_MS } from "@/lib/helpers/tripTimeZone";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

const BATCH_SIZE = 50;

const TRIP_SELECT = {
  id: true,
  userId: true,
  startDate: true,
  departureTimeZone: true,
  revealNotifiedAt: true,
  travelers: {
    where: { userId: { not: null } },
    select: { id: true, userId: true, revealNotifiedAt: true },
  },
} as const;

export interface RevealNotificationResult {
  notified: number;
  failed: number;
}

interface Recipient {
  userId: string;
  /** Persist "the provider accepted this recipient's email". Guarded so it only ever moves null -> stamped. */
  stamp: (now: Date) => Promise<unknown>;
}

/**
 * Delivers the reveal email + in-app notification to every recipient of a
 * REVEALED trip that has not departed and has not been notified yet: the buyer
 * (`TripRequest.revealNotifiedAt`) and each joined companion
 * (`TripTraveler.userId` set, own `revealNotifiedAt`). Each recipient is
 * independent: a stamp is written only after the provider accepted that
 * recipient's email, so a failure is retried on the next hourly run without
 * ever resending to recipients already stamped. Invited-but-not-joined rows
 * (`userId` null) get nothing.
 *
 * The in-app `BOOKING_REVEALED` row has a deterministic id and is inserted with
 * `skipDuplicates`, so retries never create a second one. It is attempted
 * before the email and independently of it.
 */
type RevealedTrip = Prisma.TripRequestGetPayload<{ select: typeof TRIP_SELECT }>;

async function notifyTrip(
  trip: RevealedTrip,
  now: Date,
  result: RevealNotificationResult,
): Promise<void> {
  if (!trip.startDate) return;
  const departureAt = getDepartureAt({
    startDate: trip.startDate,
    departureTimeZone: trip.departureTimeZone,
  });
  if (now >= departureAt) return;

  const recipients: Recipient[] = [];
  if (!trip.revealNotifiedAt) {
    recipients.push({
      userId: trip.userId,
      stamp: (at) =>
        prisma.tripRequest.updateMany({
          where: { id: trip.id, revealNotifiedAt: null },
          data: { revealNotifiedAt: at },
        }),
    });
  }
  const seen = new Set([trip.userId]);
  for (const traveler of trip.travelers) {
    if (!traveler.userId || traveler.revealNotifiedAt || seen.has(traveler.userId)) continue;
    seen.add(traveler.userId);
    recipients.push({
      userId: traveler.userId,
      stamp: (at) =>
        prisma.tripTraveler.updateMany({
          where: { id: traveler.id, revealNotifiedAt: null },
          data: { revealNotifiedAt: at },
        }),
    });
  }
  if (recipients.length === 0) return;

  const users = await prisma.user.findMany({
    where: { id: { in: recipients.map((recipient) => recipient.userId) } },
    select: { id: true, locale: true },
  });
  const localeOf = new Map(users.map((user) => [user.id, user.locale]));

  for (const recipient of recipients) {
    const copy = (localeOf.get(recipient.userId) === "en" ? en : es).tripRevealNotification;
    try {
      await prisma.notification.createMany({
        data: [
          {
            id: `booking-revealed:${trip.id}:${recipient.userId}`,
            userId: recipient.userId,
            type: "BOOKING_REVEALED",
            audience: "TRAVELER",
            title: copy.title,
            body: copy.body,
            metadata: { tripRequestId: trip.id },
          },
        ],
        skipDuplicates: true,
      });
    } catch (error) {
      console.error(
        `[destination-reveal] In-app reveal notification failed for trip ${trip.id}, user ${recipient.userId}:`,
        error,
      );
    }

    try {
      await deliverDestinationRevealedEmail(trip.id, recipient.userId);
      await recipient.stamp(now);
      result.notified++;
    } catch (error) {
      result.failed++;
      console.error(
        `[destination-reveal] Reveal email failed for trip ${trip.id}, user ${recipient.userId}:`,
        error,
      );
    }
  }
}

/** Hourly pass: every REVEALED, not-yet-departed trip with an unnotified buyer or joined companion. */
export async function runRevealNotifications(
  now: Date,
): Promise<RevealNotificationResult> {
  const trips = await prisma.tripRequest.findMany({
    where: {
      status: "REVEALED",
      // Widened by the zone margin; the exact departure is checked in memory.
      startDate: { gt: new Date(now.getTime() - ZONE_QUERY_MARGIN_MS) },
      OR: [
        { revealNotifiedAt: null },
        { travelers: { some: { userId: { not: null }, revealNotifiedAt: null } } },
      ],
    },
    select: TRIP_SELECT,
    orderBy: { startDate: "asc" },
    take: BATCH_SIZE,
  });

  const result: RevealNotificationResult = { notified: 0, failed: 0 };
  for (const trip of trips) await notifyTrip(trip, now, result);
  return result;
}

/** Immediate path for an admin's manual reveal: same per-recipient delivery and stamps, one trip. */
export async function notifyRevealedTrip(
  tripId: string,
  now: Date,
): Promise<RevealNotificationResult> {
  const trip = await prisma.tripRequest.findFirst({
    where: { id: tripId, status: "REVEALED" },
    select: TRIP_SELECT,
  });
  const result: RevealNotificationResult = { notified: 0, failed: 0 };
  if (trip) await notifyTrip(trip, now, result);
  return result;
}
