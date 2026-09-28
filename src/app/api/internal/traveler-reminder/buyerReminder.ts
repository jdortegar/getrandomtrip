import { prisma } from "@/lib/prisma";
import { sendTravelerDetailsReminder } from "@/lib/email/sendTravelerDetailsReminder";
import { computeTravelerCap } from "@/lib/travelers/travelerRoster";
import {
  hasMissingTravelerDetails,
  XSED_ROSTER_CUTOFF_MS,
} from "@/lib/travelers/travelerPolicy";

const LEASE_MS = 10 * 60 * 1000;

const include = {
  payment: true,
  travelers: true,
  user: { select: { email: true, locale: true } },
} as const;

/** One buyer reminder on the first hourly run at/after T-72h, including uninvited rows. */
export async function runBuyerReminder(
  now: Date,
): Promise<{ reminded: number; failed: number }> {
  const eligible = {
    type: { equals: "xsed", mode: "insensitive" as const },
    status: {
      notIn: ["CANCELLED", "COMPLETED"] as ("CANCELLED" | "COMPLETED")[],
    },
    startDate: {
      gt: now,
      lte: new Date(now.getTime() + XSED_ROSTER_CUTOFF_MS),
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
