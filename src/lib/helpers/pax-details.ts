import type { PaxDetails } from "@/lib/types/PaxDetails";

export const DEFAULT_PAX_DETAILS: PaxDetails = {
  adults: 1,
  minors: 0,
  rooms: 1,
};

/** Locked party for solo checkout (1 adult, 1 room). */
export const FIXED_PAX_SOLO: PaxDetails = {
  adults: 1,
  minors: 0,
  rooms: 1,
};

/** Locked party for couple (2 adults, 1 room). */
export const FIXED_PAX_COUPLE_LIKE: PaxDetails = {
  adults: 2,
  minors: 0,
  rooms: 1,
};

/** Locked party for group (3 adults, 1 room). */
export const FIXED_PAX_GROUP: PaxDetails = {
  adults: 3,
  minors: 0,
  rooms: 1,
};

/**
 * When non-null, checkout party size is fixed for this traveler type.
 *   solo   → 1 adult
 *   couple → 2 adults
 *
 * Group is intentionally NOT fixed here: its party size is now editable via
 * the "Travellers" substep in journey/details, defaulting to 3 adults
 * (see getDefaultPaxDetailsForTravelType) but adjustable by the user.
 */
export function getFixedPaxDetailsForTravelType(
  travelType: string,
): PaxDetails | null {
  const t = travelType.trim().toLowerCase();
  if (t === "solo") return FIXED_PAX_SOLO;
  if (t === "couple") return FIXED_PAX_COUPLE_LIKE;
  return null;
}

/**
 * Sensible starting defaults for the "Travellers" substep (group/family/paws
 * only). These are pre-filled values the user can then adjust — not locks.
 */
export function getDefaultPaxDetailsForTravelType(
  travelType: string,
): PaxDetails {
  const t = travelType.trim().toLowerCase();
  if (t === "group") return { adults: 3, minors: 0, rooms: 1, pets: 0 };
  if (t === "family") return { adults: 2, minors: 1, rooms: 1, pets: 0 };
  if (t === "paws") return { adults: 1, minors: 0, rooms: 1, pets: 1 };
  return DEFAULT_PAX_DETAILS;
}

const PAX_SUBSTEP_TRAVEL_TYPES = new Set(["group", "family", "paws"]);

/**
 * True when travelType is in scope for the journey/details "Travellers"
 * substep (Adults/Minors/Pets steppers). Single source of truth shared by
 * the substep's conditional render, the travel-type-change seeding effect,
 * and the trip-request payload builder.
 */
export function hasPaxSubstep(travelType: string | null | undefined): boolean {
  if (!travelType) return false;
  return PAX_SUBSTEP_TRAVEL_TYPES.has(travelType.trim().toLowerCase());
}

/** Which pair of headcount fields the "Travellers" substep shows for a given travel type. */
export type PaxSubstepFields = "adults-minors" | "adults-pets";

/**
 * Group and family show Adults + Minors; paws shows Adults + Pets. No travel
 * type shows all three fields, and none shows a field that doesn't apply to
 * it. Returns null outside the hasPaxSubstep scope (solo/couple/etc).
 */
export function getPaxSubstepFields(
  travelType: string | null | undefined,
): PaxSubstepFields | null {
  if (!travelType) return null;
  const t = travelType.trim().toLowerCase();
  if (t === "group" || t === "family") return "adults-minors";
  if (t === "paws") return "adults-pets";
  return null;
}

/** True when the user may change adults / minors / rooms on checkout. */
export function isTravelersPartyEditable(
  travelType: string | undefined,
): boolean {
  if (travelType == null || travelType === "") return true;
  return getFixedPaxDetailsForTravelType(travelType) == null;
}

export function parsePaxDetails(value: unknown): PaxDetails | null {
  if (value == null || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const adults = Number(o.adults);
  const minors = Number(o.minors);
  const rooms = Number(o.rooms);
  if (
    !Number.isFinite(adults) ||
    !Number.isFinite(minors) ||
    !Number.isFinite(rooms)
  ) {
    return null;
  }
  const a = Math.floor(adults);
  const m = Math.floor(minors);
  const r = Math.floor(rooms);
  if (a < 1 || m < 0 || r < 1) return null;

  // pets is optional and backward-compat: absent or invalid just defaults to
  // 0 rather than invalidating the whole (already-persisted) record.
  let pets = 0;
  if (o.pets != null) {
    const p = Number(o.pets);
    if (Number.isFinite(p) && p >= 0) pets = Math.floor(p);
  }

  return { adults: a, minors: m, rooms: r, pets };
}

export function paxDetailsFromTotalPax(totalPax: number): PaxDetails {
  const p = Math.max(1, Math.floor(totalPax));
  return { adults: p, minors: 0, rooms: 1 };
}

export function paxDetailsEquals(a: PaxDetails, b: unknown): boolean {
  const parsed = parsePaxDetails(b);
  if (!parsed) return false;
  return (
    parsed.adults === a.adults &&
    parsed.minors === a.minors &&
    parsed.rooms === a.rooms &&
    parsed.pets === (a.pets ?? 0)
  );
}
