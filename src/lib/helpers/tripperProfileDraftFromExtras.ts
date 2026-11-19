import { resolveCountryCode } from "@/lib/geo/countryNameToCode";
import {
  TRIPPER_PROFILE_TRAVELER_TYPES,
  buildEmptyTripperProfileDraft,
} from "@/lib/helpers/tripperProfileEditor";
import type {
  SocialLink,
  TripperProfileDraft,
  TripperProfilePlace,
  TripperSessionExtras,
} from "@/types/tripper";

function findSocialHandle(links: SocialLink[], network: SocialLink["network"]): string {
  return links.find((link) => link.network === network)?.handle ?? "";
}

interface DraftSourceInput {
  avatarUrl?: string | null;
  extras: TripperSessionExtras | null;
  name?: string | null;
}

/**
 * Seeds the editor from the fields the current settings page already stores,
 * so an existing Tripper never starts from a blank profile. Values are not
 * truncated: anything over a new limit is flagged in the UI instead.
 */
export function tripperProfileDraftFromExtras({
  avatarUrl,
  extras,
  name,
}: DraftSourceInput): TripperProfileDraft {
  const draft = buildEmptyTripperProfileDraft();
  if (!extras) {
    draft.identity.name = name ?? "";
    draft.identity.portraitUrl = avatarUrl ?? "";
    return draft;
  }

  const links = Array.isArray(extras.socialLinks) ? extras.socialLinks : [];
  const seenCountries = new Set<string>();
  const places: TripperProfilePlace[] = [];
  for (const destination of extras.destinations ?? []) {
    const code = resolveCountryCode(destination);
    if (!code || seenCountries.has(code)) continue;
    seenCountries.add(code);
    places.push({ countryCode: code, id: `place-${code}`, isLocalExpert: false });
  }

  draft.identity = {
    ...draft.identity,
    city: extras.location ?? "",
    coverUrl: extras.heroImage ?? "",
    name: extras.nickname || name || "",
    portraitUrl: avatarUrl ?? "",
    slug: extras.tripperSlug ?? "",
  };
  draft.bio.body = extras.bio ?? "";
  draft.places = places;
  draft.media.linkedinUrl = findSocialHandle(links, "linkedin");

  const available = extras.availableTypes ?? [];
  for (const type of TRIPPER_PROFILE_TRAVELER_TYPES) {
    draft.travelerTypes[type].enabled = available.includes(type);
  }
  return draft;
}
