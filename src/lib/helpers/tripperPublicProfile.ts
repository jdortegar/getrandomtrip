import { TRIPPER_PROFILE_MAX_FEATURED_STORIES } from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import type {
  TripperProfileCountryGroup,
  TripperProfileDraft,
  TripperProfileMediaItem,
  TripperProfilePlace,
  TripperProfileStoryOption,
  TripperProfileStorySource,
} from "@/types/tripper";

const YOUTUBE_ID = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i;
const INSTAGRAM_POST = /instagram\.com\/(p|reel|reels)\/([\w-]+)/i;
const TIKTOK_VIDEO = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/i;

/**
 * Embeddable player URL for a public post, or null when the link can't be
 * embedded (e.g. an Instagram profile) — the card then links to the original.
 * Uploads play in a native <video>, so they have no embed URL either.
 */
export function getMediaEmbedUrl(item: Pick<TripperProfileMediaItem, "provider" | "url">): string | null {
  const url = item.url.trim();
  switch (item.provider) {
    case "youtube": {
      const id = YOUTUBE_ID.exec(url)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    case "instagram": {
      const match = INSTAGRAM_POST.exec(url);
      if (!match) return null;
      const kind = match[1]!.toLowerCase() === "p" ? "p" : "reel";
      return `https://www.instagram.com/${kind}/${match[2]}/embed`;
    }
    case "tiktok": {
      const id = TIKTOK_VIDEO.exec(url)?.[1];
      return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
    }
    case "upload":
      return null;
  }
}

/** Items the Tripper chose to show and that have something to play or open. */
export function getVisibleMediaItems(items: TripperProfileMediaItem[]): TripperProfileMediaItem[] {
  return items.filter((item) => item.isVisible && item.url.trim().length > 0);
}

/**
 * The Tripper's featured stories in their chosen order; when none are featured
 * (or none still exist), Randomtrip's editorial picks fill in, keeping their
 * own authorship.
 */
export function resolveProfileStories(
  featuredIds: string[],
  stories: TripperProfileStoryOption[],
  editorialFallback: TripperProfileStoryOption[],
): { source: TripperProfileStorySource; stories: TripperProfileStoryOption[] } {
  const byId = new Map(stories.map((story) => [story.id, story]));
  const featured = featuredIds
    .map((id) => byId.get(id))
    .filter((story): story is TripperProfileStoryOption => !!story)
    .slice(0, TRIPPER_PROFILE_MAX_FEATURED_STORIES);
  if (featured.length > 0) return { source: "tripper", stories: featured };
  return {
    source: "editorial",
    stories: editorialFallback.slice(0, TRIPPER_PROFILE_MAX_FEATURED_STORIES),
  };
}

/** Groups places by country, keeping first-seen order. */
export function groupPlacesByCountry(places: TripperProfilePlace[]): TripperProfileCountryGroup[] {
  const groups = new Map<string, TripperProfilePlace[]>();
  for (const place of places) {
    const list = groups.get(place.countryCode) ?? [];
    list.push(place);
    groups.set(place.countryCode, list);
  }
  return [...groups].map(([countryCode, grouped]) => ({ countryCode, places: grouped }));
}

/** Traveler types switched on, in display order. */
export function getEnabledTravelerTypes(draft: TripperProfileDraft) {
  return (["solo", "couple", "group"] as const).filter((type) => draft.travelerTypes[type].enabled);
}

/** Size of the world-map SVG (`/maps/world-110m.json`), in its own units. */
export const WORLD_MAP_SIZE = { height: 500, width: 1000 } as const;

/**
 * Projects a coordinate onto the world-map SVG — the same equirectangular
 * projection (lat 85° to -60°) the map paths were generated with.
 */
export function projectToWorldMap({ lat, lng }: { lat: number; lng: number }): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * WORLD_MAP_SIZE.width,
    y: ((85 - lat) / 145) * WORLD_MAP_SIZE.height,
  };
}
