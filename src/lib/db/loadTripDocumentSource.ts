import type { Prisma } from "@prisma/client";
import type { DocumentPrefillSource } from "@/lib/types/DocumentProviderCandidate";
import type { TripDocumentSnapshotSource } from "@/lib/types/TripDocumentSnapshot";
import { isXsedExperience } from "@/lib/experiences/xsedExperience";

/** Creation-only trusted adapter; caller holds live owner/trip locks and has
 * authorized admin access. Never invoke to refresh an existing saved draft.
 */
export async function loadTripDocumentSource(
  tx: Prisma.TransactionClient,
  tripRequestId: string,
): Promise<{
  trip: TripDocumentSnapshotSource;
  provider: DocumentPrefillSource;
}> {
  const row = await tx.tripRequest.findUnique({
    where: { id: tripRequestId },
    select: {
      user: { select: { name: true, locale: true } },
      travelers: { select: { fullName: true }, orderBy: { id: "asc" } },
      originCity: true,
      actualDestination: true,
      startDate: true,
      endDate: true,
      pax: true,
      experience: {
        select: {
          title: true,
          destinationCountry: true,
          destinationCity: true,
          level: true,
          type: true,
          hotels: true,
          activities: true,
          sections: true,
          itinerary: true,
        },
      },
    },
  });
  if (!row) throw new Error("DOCUMENT_SOURCE_TRIP_NOT_FOUND");
  const experience = row.experience;
  return {
    trip: {
      user: row.user,
      travelers: row.travelers,
      originCity: row.originCity,
      actualDestination: row.actualDestination,
      startDate: row.startDate,
      endDate: row.endDate,
      pax: row.pax,
      experience: experience
        ? {
            title: experience.title,
            destinationCountry: experience.destinationCountry,
            destinationCity: experience.destinationCity,
          }
        : null,
    },
    provider: experience
      ? {
          kind: isXsedExperience(experience) ? "xsed" : "experience",
          hotels: experience.hotels,
          activities: experience.activities,
          sections: experience.sections,
          itinerary: experience.itinerary,
        }
      : { kind: "experience" },
  };
}
