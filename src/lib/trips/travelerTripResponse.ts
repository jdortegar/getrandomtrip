import type { Prisma } from "@prisma/client";
import { isFulfillmentVisible } from "@/lib/trips/fulfillmentVisibility";

/** Buyer/companion DTO fields, never the private authoring record. */
export const TRAVELER_EXPERIENCE_SELECT = {
  id: true,
  title: true,
  heroImage: true,
  destinationCity: true,
  destinationCountry: true,
  teaser: true,
  description: true,
  // Read only to derive `hotelName`; the raw records (incl. referral links)
  // never leave the server.
  hotels: true,
  // Read only to derive the URL-only `photos` list (see `experiencePhotos`).
  gallery: true,
  sections: true,
  activities: true,
  itinerary: true,
  inclusions: true,
  exclusions: true,
} satisfies Prisma.ExperienceSelect;

/** The first stay's display name, e.g. "Estancia La Oriental". Hotels hold
 * private authoring data (referral links, notes), so only the name is exposed. */
function firstHotelName(hotels: unknown): string | null {
  if (!Array.isArray(hotels)) return null;
  for (const hotel of hotels) {
    const name = (hotel as { hotelName?: unknown } | null)?.hotelName;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return null;
}

/** Destination photo URLs for the guide carousel: gallery, XSED section photos,
 * then activity photos — URLs only, never the records around them (activity
 * risk notes, section contacts), de-duplicated, in that order. */
function experiencePhotos(experience: Record<string, unknown>): string[] {
  const urls: unknown[] = [];
  if (Array.isArray(experience.gallery)) urls.push(...experience.gallery);
  if (Array.isArray(experience.sections)) {
    for (const section of experience.sections) {
      const photos = (section as { photos?: unknown } | null)?.photos;
      if (Array.isArray(photos)) for (const photo of photos) urls.push((photo as { url?: unknown } | null)?.url);
    }
  }
  if (Array.isArray(experience.activities)) {
    for (const activity of experience.activities) urls.push((activity as { image?: unknown } | null)?.image);
  }
  const clean = urls.filter((url): url is string => typeof url === "string" && url.trim() !== "").map((url) => url.trim());
  return [...new Set(clean)];
}

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
          teaser: experience.teaser,
          description: experience.description,
          hotelName: firstHotelName(experience.hotels),
          photos: experiencePhotos(experience),
          itinerary: experience.itinerary,
          inclusions: experience.inclusions,
          exclusions: experience.exclusions,
        }),
      },
    }),
  };
}
