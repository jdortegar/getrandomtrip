import { prisma } from "@/lib/prisma";
import { sendDestinationRevealed } from "@/lib/email";

// ─── Pass 2: T-48h auto-reveal ────────────────────────────────────────────────

export interface Pass2Result {
  revealed: number;
}

export async function runPass2(now: Date): Promise<Pass2Result> {
  const threshold48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find CONFIRMED trips within T-48h that have an experience assigned
  const revealable = await prisma.tripRequest.findMany({
    where: {
      status: "CONFIRMED",
      startDate: { lte: threshold48, gte: now },
      experienceId: { not: null },
    },
    select: {
      id: true,
      userId: true,
      experienceId: true,
      actualDestination: true,
    },
  });

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

      sendDestinationRevealed(trip.id, trip.userId);
      revealed++;
    } catch (err) {
      console.error(
        `[destination-reveal] Pass 2 error for trip ${trip.id}:`,
        err,
      );
    }
  }

  return { revealed };
}
