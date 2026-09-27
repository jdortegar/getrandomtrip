import type { Prisma } from "@prisma/client";
import { isFulfillmentVisible } from "@/lib/trips/fulfillmentVisibility";

/** Buyer/companion DTO fields, never the private authoring record. */
export const TRAVELER_EXPERIENCE_SELECT = {
  id: true,
  title: true,
  heroImage: true,
  destinationCity: true,
  destinationCountry: true,
  itinerary: true,
  inclusions: true,
  exclusions: true,
} satisfies Prisma.ExperienceSelect;

interface TravelerTrip {
  status: string;
  actualDestination?: string | null;
  experience?: Record<string, unknown> | null;
}

/** Buyer routes have no role bypass: admins author through admin endpoints. */
export function toTravelerTripResponse<T extends TravelerTrip>(trip: T) {
  const visible = isFulfillmentVisible(trip.status, false);
  const experience = trip.experience;
  return {
    ...trip,
    ...("actualDestination" in trip && {
      actualDestination: visible ? trip.actualDestination : null,
    }),
    ...(experience && {
      experience: {
        id: experience.id,
        title: experience.title,
        heroImage: experience.heroImage,
        ...(visible && {
          destinationCity: experience.destinationCity,
          destinationCountry: experience.destinationCountry,
          itinerary: experience.itinerary,
          inclusions: experience.inclusions,
          exclusions: experience.exclusions,
        }),
      },
    }),
  };
}
