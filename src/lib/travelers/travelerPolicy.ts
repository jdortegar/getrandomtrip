import { getDepartureAt } from "@/lib/helpers/getRevealCountdown";
import {
  isIsoCountryCode,
  isVisaCode,
  normalizeCountryCodes,
  normalizeVisaCodes,
} from "@/lib/geo/countryOptions";
import type { TripTiming } from "@/types/core";
import type { TravelerDocumentCodesResult } from "@/types/traveler";

/** Elapsed-time cutoffs, not calendar-day rounding. */
export const ROSTER_CUTOFF_MS = 7 * 24 * 60 * 60 * 1000;
export const XSED_ROSTER_CUTOFF_MS = 72 * 60 * 60 * 1000;

export function rosterCutoffMs(type?: string): number {
  return type?.trim().toLowerCase() === "xsed"
    ? XSED_ROSTER_CUTOFF_MS
    : ROSTER_CUTOFF_MS;
}

/** Instant populated roster fields become protected: departure (local midnight) minus the type's cutoff. */
export function getRosterCutoffAt(trip: TripTiming & { type?: string }): Date {
  return new Date(getDepartureAt(trip).getTime() - rosterCutoffMs(trip.type));
}

export function isTravelerFieldFilled(
  value: string | Date | null | undefined,
): boolean {
  return value instanceof Date
    ? Number.isFinite(value.getTime())
    : typeof value === "string" && value.trim() !== "";
}

export interface TravelerIdentity {
  kind: string;
  fullName: string | null;
  email: string | null;
  idDocument: string | null;
  dateOfBirth: string | Date | null;
}

export function hasMissingTravelerDetails(traveler: TravelerIdentity): boolean {
  return [
    traveler.fullName,
    traveler.idDocument,
    traveler.kind === "MINOR" ? traveler.dateOfBirth : traveler.email,
  ].some((value) => !isTravelerFieldFilled(value));
}

/**
 * Defensive read of `TripRequest.paxDetails` — missing or non-numeric
 * `adults`/`minors` are treated as `0` rather than erroring. Row counts are
 * fixed at payment success: one row per companion, i.e. `adults - 1` adult
 * rows (the buyer themselves is not a row) and `minors` minor rows.
 */
export function computeTravelerCap(paxDetails: unknown): {
  adultRows: number;
  minorRows: number;
} {
  const raw =
    paxDetails && typeof paxDetails === "object"
      ? (paxDetails as Record<string, unknown>)
      : {};

  const adults =
    typeof raw.adults === "number" && Number.isFinite(raw.adults)
      ? raw.adults
      : 0;
  const minors =
    typeof raw.minors === "number" && Number.isFinite(raw.minors)
      ? raw.minors
      : 0;

  return {
    adultRows: Math.max(0, adults - 1),
    minorRows: Math.max(0, minors),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * True once the trip is over. The trip day is the UTC calendar day of
 * `endDate` (falling back to `startDate`), inclusive: an invite stays
 * acceptable through that whole day. Trips without dates never end.
 */
export function isTripEnded(
  trip: { startDate: Date | null; endDate?: Date | null },
  now: number = Date.now(),
): boolean {
  const reference = trip.endDate ?? trip.startDate;
  if (!reference) return false;
  const endOfTripDay =
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate(),
    ) + DAY_MS;
  return now >= endOfTripDay;
}

/**
 * Roster completeness: the row's details are all saved AND it is not a bare
 * `PENDING` row. `INVITED` rows count — inviting a companion must not make a
 * fully filled row look incomplete; `COMPLETE` only additionally means the
 * companion accepted the invite.
 */
export function isTravelerRosterComplete(
  traveler: TravelerIdentity & { status: string },
): boolean {
  return (
    (traveler.status === "COMPLETE" || traveler.status === "INVITED") &&
    !hasMissingTravelerDetails(traveler)
  );
}

/**
 * True once the traveler has at least one nationality. Feeds the admin
 * missing-documents warning; deliberately NOT part of roster completeness.
 */
export function hasTravelDocuments(traveler: {
  nationalities?: readonly string[] | null;
}): boolean {
  return (traveler.nationalities?.length ?? 0) > 0;
}

/** Same code set, ignoring order. */
export function travelerCodesEqual(
  a: readonly string[],
  b: readonly string[],
): boolean {
  return a.length === b.length && a.every((code) => b.includes(code));
}

/** Entries that are not strings passing `isValid` once trimmed and uppercased. */
function invalidCodes(values: unknown[], isValid: (code: string) => boolean): string[] {
  return values
    .filter((entry) => typeof entry !== "string" || !isValid(entry.trim().toUpperCase()))
    .map(String);
}

/**
 * Validates optional `nationalities` (ISO 3166-1 alpha-2 only) and `visas`
 * (ISO plus visa zone codes) from a request body. Absent lists stay
 * `undefined` (leave unchanged); empty lists are allowed. Error messages match
 * `/api/user/documents` so clients can treat every documents endpoint alike.
 */
export function parseTravelerDocumentCodes(body: {
  nationalities?: unknown;
  visas?: unknown;
}): TravelerDocumentCodesResult {
  const lists = [
    ["nationalities", body.nationalities, isIsoCountryCode, "Invalid nationalities"],
    ["visas", body.visas, isVisaCode, "Invalid visas"],
  ] as const;
  for (const [, value, isValid, error] of lists) {
    if (value === undefined) continue;
    if (!Array.isArray(value)) return { ok: false, error, invalid: [] };
    const invalid = invalidCodes(value, isValid);
    if (invalid.length > 0) return { ok: false, error, invalid };
  }
  return {
    ok: true,
    nationalities: Array.isArray(body.nationalities)
      ? normalizeCountryCodes(body.nationalities as string[])
      : undefined,
    visas: Array.isArray(body.visas)
      ? normalizeVisaCodes(body.visas as string[])
      : undefined,
  };
}
