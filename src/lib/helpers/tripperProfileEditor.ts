import {
  TRIPPER_PROFILE_BIO_MIN_LENGTH,
  TRIPPER_PROFILE_MAX_AFFINITIES,
  TRIPPER_PROFILE_SLUG_PATTERN,
  TRIPPER_PROFILE_TEXT_LIMITS,
} from "@/lib/constants/TRIPPER_PROFILE_LIMITS";
import type {
  TripperProfileAffinity,
  TripperProfileDraft,
  TripperProfileMediaProvider,
  TripperProfilePlace,
  TripperProfileStepId,
  TripperProfileStepProgress,
  TripperProfileTravelerType,
} from "@/types/tripper";

/** Editor steps in display order; the first three are required to submit. */
export const TRIPPER_PROFILE_STEPS: { essential: boolean; id: TripperProfileStepId }[] = [
  { essential: true, id: "identity" },
  { essential: true, id: "perspective" },
  { essential: true, id: "travelerTypes" },
  { essential: false, id: "atlas" },
  { essential: false, id: "media" },
  { essential: false, id: "stories" },
];

export const TRIPPER_PROFILE_TRAVELER_TYPES: TripperProfileTravelerType[] = [
  "solo",
  "couple",
  "group",
];

export const TRIPPER_PROFILE_AFFINITIES: TripperProfileAffinity[] = [
  "backRoads",
  "localTables",
  "slowTravel",
  "natureMountains",
  "designCulture",
  "cityLife",
  "seaCoast",
  "outdoorAdventure",
  "wellnessPause",
];

/** Providers offered in the "what do you want to add?" select, in order. */
export const TRIPPER_PROFILE_MEDIA_PROVIDERS: TripperProfileMediaProvider[] = [
  "youtube",
  "instagram",
  "tiktok",
  "upload",
];

const MEDIA_URL_PATTERNS: Record<Exclude<TripperProfileMediaProvider, "upload">, RegExp> = {
  instagram: /^https:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
  youtube:
    /^https:\/\/((www|m)\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{6,}/i,
};

function hasText(value: string | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

/** True when a value exceeds its limit — e.g. legacy text longer than the new cap. */
export function isOverLimit(value: string, max: number): boolean {
  return value.length > max;
}

export function isValidProfileSlug(slug: string): boolean {
  return (
    TRIPPER_PROFILE_SLUG_PATTERN.test(slug) &&
    slug.length <= TRIPPER_PROFILE_TEXT_LIMITS.slug
  );
}

/** Lowercases, strips accents and collapses anything else into single hyphens. */
export function toProfileSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, TRIPPER_PROFILE_TEXT_LIMITS.slug);
}

/** Uploads are validated by file type; external providers need a public post URL. */
export function isValidMediaUrl(
  provider: TripperProfileMediaProvider,
  url: string,
): boolean {
  if (provider === "upload") return hasText(url);
  return MEDIA_URL_PATTERNS[provider].test(url.trim());
}

export function isIdentityComplete(draft: TripperProfileDraft): boolean {
  const { identity } = draft;
  const limits = TRIPPER_PROFILE_TEXT_LIMITS;
  return (
    hasText(identity.name) &&
    !isOverLimit(identity.name, limits.name) &&
    hasText(identity.countryCode) &&
    hasText(identity.city) &&
    !isOverLimit(identity.city, limits.city) &&
    isValidProfileSlug(identity.slug) &&
    hasText(identity.headline) &&
    !isOverLimit(identity.headline, limits.headline) &&
    (!hasText(identity.coverUrl) || hasText(identity.coverAlt)) &&
    !isOverLimit(identity.coverAlt, limits.coverAlt) &&
    !isOverLimit(identity.coverCaption, limits.coverCaption)
  );
}

export function isPerspectiveComplete(draft: TripperProfileDraft): boolean {
  const { bio } = draft;
  const limits = TRIPPER_PROFILE_TEXT_LIMITS;
  return (
    hasText(bio.title) &&
    !isOverLimit(bio.title, limits.bioTitle) &&
    !isOverLimit(bio.lead, limits.bioLead) &&
    bio.body.trim().length >= TRIPPER_PROFILE_BIO_MIN_LENGTH &&
    !isOverLimit(bio.body, limits.bioBody) &&
    !isOverLimit(bio.more, limits.bioMore) &&
    bio.affinities.length > 0 &&
    bio.affinities.length <= TRIPPER_PROFILE_MAX_AFFINITIES
  );
}

export function isTravelerTypesComplete(draft: TripperProfileDraft): boolean {
  const enabled = TRIPPER_PROFILE_TRAVELER_TYPES.filter(
    (type) => draft.travelerTypes[type].enabled,
  );
  return (
    enabled.length > 0 &&
    enabled.every((type) => {
      const card = draft.travelerTypes[type];
      return (
        hasText(card.text) &&
        !isOverLimit(card.text, TRIPPER_PROFILE_TEXT_LIMITS.travelerTypeText)
      );
    })
  );
}

function isStepComplete(id: TripperProfileStepId, draft: TripperProfileDraft): boolean {
  switch (id) {
    case "identity":
      return isIdentityComplete(draft);
    case "perspective":
      return isPerspectiveComplete(draft);
    case "travelerTypes":
      return isTravelerTypesComplete(draft);
    case "atlas":
      return draft.places.length > 0;
    case "media":
      return draft.media.items.length > 0 || draft.media.gallery.length > 0;
    case "stories":
      return draft.featuredStoryIds.length > 0;
  }
}

export function getTripperProfileProgress(
  draft: TripperProfileDraft,
): TripperProfileStepProgress[] {
  return TRIPPER_PROFILE_STEPS.map((step) => ({
    ...step,
    complete: isStepComplete(step.id, draft),
  }));
}

/** Submitting needs only the three essential steps; atlas, media and stories stay optional. */
export function canSubmitTripperProfile(draft: TripperProfileDraft): boolean {
  return getTripperProfileProgress(draft).every(
    (step) => !step.essential || step.complete,
  );
}

/** Returns a copy with the item at `index` swapped one slot up (-1) or down (+1). */
export function moveListItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) {
    return list;
  }
  const next = [...list];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

/** Adds the affinity, or removes it if already selected; ignores additions past the max. */
export function toggleAffinity(
  selected: TripperProfileAffinity[],
  affinity: TripperProfileAffinity,
): TripperProfileAffinity[] {
  if (selected.includes(affinity)) return selected.filter((a) => a !== affinity);
  if (selected.length >= TRIPPER_PROFILE_MAX_AFFINITIES) return selected;
  return [...selected, affinity];
}

/** Same country + city (case-insensitive) counts as the same place. */
export function hasProfilePlace(
  places: TripperProfilePlace[],
  countryCode: string,
  city: string | undefined,
): boolean {
  const key = (city ?? "").trim().toLowerCase();
  return places.some(
    (place) =>
      place.countryCode === countryCode &&
      (place.city ?? "").trim().toLowerCase() === key,
  );
}

export function createProfileItemId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

export function buildEmptyTripperProfileDraft(): TripperProfileDraft {
  const emptyCard = { enabled: false, imageUrl: "", text: "" };
  return {
    bio: { affinities: [], body: "", lead: "", more: "", title: "" },
    featuredStoryIds: [],
    identity: {
      city: "",
      countryCode: "",
      coverAlt: "",
      coverCaption: "",
      coverUrl: "",
      headline: "",
      name: "",
      portraitUrl: "",
      slug: "",
    },
    media: { gallery: [], items: [], linkedinUrl: "", websiteUrl: "" },
    places: [],
    travelerTypes: {
      couple: { ...emptyCard },
      group: { ...emptyCard },
      solo: { ...emptyCard },
    },
  };
}
