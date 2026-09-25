import type { Prisma } from "@prisma/client";
import type { DocumentPrefillSource } from "@/lib/types/DocumentProviderCandidate";
import type { TripDocumentSnapshotSource } from "@/lib/types/TripDocumentSnapshot";
import type { ExperienceItinerary } from "@/lib/types/TripDocumentSource";
import {
  isXsedExperience,
  XSED_EXPERIENCE_WHERE,
} from "@/lib/experiences/xsedExperience";
import { canonicalizeExperienceTypeFilter } from "@/lib/experiences/experienceTypeFilter";

const experienceSelect = {
  title: true,
  destinationCountry: true,
  destinationCity: true,
  level: true,
  type: true,
  hotels: true,
  activities: true,
  sections: true,
  itinerary: true,
  inclusions: true,
  exclusions: true,
} satisfies Prisma.ExperienceSelect;

/** Trusted source adapter for previews/creation; caller holds owner/trip locks and has
 * authorized admin access. Never invoke to refresh an existing saved draft.
 */
export async function loadTripDocumentSource(
  tx: Prisma.TransactionClient,
  tripRequestId: string,
  experienceId?: string | null,
): Promise<{
  trip: TripDocumentSnapshotSource;
  provider: DocumentPrefillSource;
  experienceItinerary: ExperienceItinerary | null;
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
      tripperId: true,
      type: true,
      experience: { select: experienceSelect },
    },
  });
  if (!row) throw new Error("DOCUMENT_SOURCE_TRIP_NOT_FOUND");
  // Omitted means persisted assignment; null means an explicitly cleared local
  // selection. An override must satisfy the same filters as the assignment list.
  let experience = experienceId === null ? null : row.experience;
  if (experienceId !== undefined && experienceId !== null) {
    const type = canonicalizeExperienceTypeFilter(row.type ?? "");
    experience = await tx.experience.findFirst({
      where: {
        id: experienceId,
        status: "ACTIVE",
        owner: { isActive: true },
        ...(row.tripperId ? { ownerId: row.tripperId } : {}),
        ...(type === "XSED"
          ? { AND: [XSED_EXPERIENCE_WHERE] }
          : type
            ? { type: { has: type } }
            : {}),
      },
      select: experienceSelect,
    });
    if (!experience) throw new Error("DOCUMENT_SOURCE_EXPERIENCE_UNAVAILABLE");
  }
  return {
    trip: {
      user: row.user,
      travelers: row.travelers,
      originCity: row.originCity,
      actualDestination:
        experienceId === undefined
          ? row.actualDestination
          : experience
            ? `${experience.destinationCity}, ${experience.destinationCountry}`
            : null,
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
    experienceItinerary: experience
      ? {
          title: experience.title,
          itinerary: experience.itinerary,
          inclusions: experience.inclusions,
          exclusions: experience.exclusions,
        }
      : null,
  };
}
