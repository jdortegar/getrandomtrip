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
