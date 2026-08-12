/**
 * `Experience.type` stores journey traveler types LOWERCASE (e.g. `["couple"]`)
 * and only the XSED sentinel UPPERCASE (`["XSED"]`). A caller-supplied `type`
 * filter must be canonicalized per-token to whichever casing that specific
 * value is actually stored in — a blanket `.toUpperCase()` would break every
 * existing `?type=couple` caller. See design.md ADR-3.
 */
export const XSED_EXPERIENCE_TYPE = "XSED";
export const TRAVELER_EXPERIENCE_TYPES = [
  "couple",
  "family",
  "group",
  "solo",
  "honeymoon",
  "paws",
] as const;

/**
 * Maps a caller-supplied `type` filter to the exact casing stored on
 * `Experience.type`. Unknown tokens pass through trimmed — never silently
 * mangled.
 */
export function canonicalizeExperienceTypeFilter(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.toUpperCase() === XSED_EXPERIENCE_TYPE) {
    return XSED_EXPERIENCE_TYPE;
  }
  const lowered = trimmed.toLowerCase();
  if ((TRAVELER_EXPERIENCE_TYPES as readonly string[]).includes(lowered)) {
    return lowered;
  }
  return trimmed;
}
