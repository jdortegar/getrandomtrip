import { prisma } from "@/lib/prisma";
import { isInRevealWindow } from "@/lib/helpers/getRevealCountdown";
import { ZONE_QUERY_MARGIN_MS } from "@/lib/helpers/tripTimeZone";
import { runRevealNotifications } from "@/lib/trips/revealNotifications";

// ─── Pass 2: auto-reveal at 09:00 departure-local, two days before departure ──

export interface Pass2Result {
  revealed: number;
  /** Recipients (buyers + joined companions) whose reveal email was accepted this run, incl. retries. */
  notified: number;
  /** Recipients whose reveal email failed this run; left unstamped and retried next run. */
  notifyFailed: number;
}

const REVEAL_LEAD_MS = 2 * 24 * 60 * 60 * 1000;

export async function runPass2(now: Date): Promise<Pass2Result> {
  // Conservative superset: the real reveal instant depends on each trip's zone,
  // so the exact check is done in memory with `isInRevealWindow`.
  const candidates = await prisma.tripRequest.findMany({
    where: {
      status: "CONFIRMED",
      startDate: {
        gt: new Date(now.getTime() - ZONE_QUERY_MARGIN_MS),
        lte: new Date(now.getTime() + REVEAL_LEAD_MS + ZONE_QUERY_MARGIN_MS),
      },
      experienceId: { not: null },
    },
    select: {
      id: true,
      userId: true,
      experienceId: true,
      actualDestination: true,
      startDate: true,
      departureTimeZone: true,
    },
  });
  const revealable = candidates.filter(
    (trip) => trip.startDate && isInRevealWindow({ startDate: trip.startDate, departureTimeZone: trip.departureTimeZone }, now),
  );

  let revealed = 0;

  for (const trip of revealable) {
    try {
      // Resolve destination from the assigned experience
      const experience = await prisma.experience.findUnique({
        where: { id: trip.experienceId! },
        select: { destinationCity: true, destinationCountry: true },
      });

      const actualDestination =
        trip.actualDestination ??
        (experience
          ? `${experience.destinationCity}, ${experience.destinationCountry}`
          : null);

      if (!actualDestination) {
        console.error(
          `[destination-reveal] Pass 2: no destination for trip ${trip.id}, skipping`,
        );
        continue;
      }

      // Guarded update — status guard ensures idempotency
      const updated = await prisma.tripRequest.updateMany({
        where: { id: trip.id, status: "CONFIRMED" },
        data: {
          status: "REVEALED",
          destinationRevealedAt: now,
          actualDestination,
        },
      });

      if (updated.count === 0) {
        // Already revealed by another process
        continue;
      }

      revealed++;
    } catch (err) {
      console.error(
        `[destination-reveal] Pass 2 error for trip ${trip.id}:`,
        err,
      );
    }
  }

  // Awaited delivery to buyer + joined companions, including REVEALED trips
  // whose earlier attempt failed (stamp still null) and that have not departed.
  let notified = 0;
  let notifyFailed = 0;
  try {
    ({ notified, failed: notifyFailed } = await runRevealNotifications(now));
  } catch (err) {
    notifyFailed++;
    console.error("[destination-reveal] Reveal notification pass failed:", err);
  }

  return { revealed, notified, notifyFailed };
}
