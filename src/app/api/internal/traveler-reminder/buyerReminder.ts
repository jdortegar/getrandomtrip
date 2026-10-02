import { prisma } from "@/lib/prisma";
import { sendTravelerDetailsReminder } from "@/lib/email/sendTravelerDetailsReminder";
import { computeTravelerCap } from "@/lib/travelers/travelerRoster";
import {
  getRosterCutoffAt,
  hasMissingTravelerDetails,
  XSED_ROSTER_CUTOFF_MS,
} from "@/lib/travelers/travelerPolicy";
import { getDepartureAt } from "@/lib/helpers/getRevealCountdown";
import { ZONE_QUERY_MARGIN_MS } from "@/lib/helpers/tripTimeZone";

const LEASE_MS = 10 * 60 * 1000;

const include = {
  payment: true,
  travelers: true,
  user: { select: { email: true, locale: true } },
} as const;

/** Exact check: inside [departure - 72h, departure) in the trip's own zone. */
function isInReminderWindow(
  trip: { startDate: Date | null; departureTimeZone: string | null },
  now: Date,
): boolean {
  if (!trip.startDate) return false;
  const timing = { startDate: trip.startDate, departureTimeZone: trip.departureTimeZone };
  return (
    now >= getRosterCutoffAt({ ...timing, type: "xsed" }) &&
    now < getDepartureAt(timing)
  );
}

/** One buyer reminder on the first hourly run at/after T-72h, including uninvited rows. */
export async function runBuyerReminder(
  now: Date,
): Promise<{ reminded: number; failed: number }> {
  const eligible = {
    type: { equals: "xsed", mode: "insensitive" as const },
    status: {
      notIn: ["CANCELLED", "COMPLETED"] as ("CANCELLED" | "COMPLETED")[],
    },
    // Widened by the zone margin; the exact local-midnight window is checked in memory.
    startDate: {
      gt: new Date(now.getTime() - ZONE_QUERY_MARGIN_MS),
      lte: new Date(now.getTime() + XSED_ROSTER_CUTOFF_MS + ZONE_QUERY_MARGIN_MS),
    },
    payment: { is: { status: "APPROVED" as const } },
    travelerDetailsReminderSentAt: null,
  };
  const candidates = await prisma.tripRequest.findMany({
    where: eligible,
    include,
  });
  let reminded = 0;
  let failed = 0;

  for (const candidate of candidates) {
    if (!isInReminderWindow(candidate, now)) continue;
    const cap = computeTravelerCap(candidate.paxDetails);
    if (
      !candidate.travelers.some(hasMissingTravelerDetails) &&
      candidate.travelers.length >= cap.adultRows + cap.minorRows
    )
      continue;

    const claim = await prisma.tripRequest.updateMany({
      where: {
        ...eligible,
        id: candidate.id,
        OR: [
          { travelerDetailsReminderClaimedAt: null },
          {
            travelerDetailsReminderClaimedAt: {
              lte: new Date(now.getTime() - LEASE_MS),
            },
          },
        ],
      },
      data: { travelerDetailsReminderClaimedAt: now },
    });
    if (!claim.count) continue;
    const ownedClaim = {
      id: candidate.id,
      travelerDetailsReminderClaimedAt: now,
      travelerDetailsReminderSentAt: null,
    };
    try {
      // Recheck after winning the claim: another request may have completed the roster.
      const trip = await prisma.tripRequest.findFirst({
        where: { ...eligible, ...ownedClaim },
        include,
      });
      const currentCap = trip ? computeTravelerCap(trip.paxDetails) : null;
      if (
        trip &&
        isInReminderWindow(trip, now) &&
        currentCap &&
        (trip.travelers.some(hasMissingTravelerDetails) ||
          trip.travelers.length < currentCap.adultRows + currentCap.minorRows)
      ) {
        await sendTravelerDetailsReminder({
          tripId: trip.id,
          buyer: trip.user,
        });
        await prisma.tripRequest.updateMany({
          where: ownedClaim,
          data: {
            travelerDetailsReminderSentAt: now,
            travelerDetailsReminderClaimedAt: null,
          },
        });
        reminded++;
      } else {
        await prisma.tripRequest.updateMany({
          where: ownedClaim,
          data: { travelerDetailsReminderClaimedAt: null },
        });
      }
    } catch (error) {
      failed++;
      console.error(
        `[traveler-reminder] Buyer reminder failed for trip ${candidate.id}:`,
        error,
      );
      // Never release a newer worker's lease. A failed release recovers after LEASE_MS.
      await prisma.tripRequest
        .updateMany({
          where: ownedClaim,
          data: { travelerDetailsReminderClaimedAt: null },
        })
        .catch((releaseError) =>
          console.error(
            "[traveler-reminder] Lease release failed:",
            releaseError,
          ),
        );
    }
  }
  return { reminded, failed };
}
