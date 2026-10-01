/** Elapsed-time cutoffs, not calendar-day rounding. */
export const ROSTER_CUTOFF_MS = 7 * 24 * 60 * 60 * 1000;
export const XSED_ROSTER_CUTOFF_MS = 72 * 60 * 60 * 1000;

export function rosterCutoffMs(type?: string): number {
  return type?.trim().toLowerCase() === "xsed"
    ? XSED_ROSTER_CUTOFF_MS
    : ROSTER_CUTOFF_MS;
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
