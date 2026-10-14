import { normalizeCountryCodes } from "@/lib/geo/countryOptions";
import { resolveNationalityCode, toVisaCodes } from "@/lib/geo/visaCodes";
import type { TravelerDocuments } from "@/types/traveler";

/** The `User` fields `profileTravelDocuments` reads; spread into Prisma selects. */
export const PROFILE_DOCUMENTS_SELECT = {
  nationalities: true,
  approvedVisas: true,
  passportCountry: true,
} as const;

/** A `User` row narrowed to `PROFILE_DOCUMENTS_SELECT`. */
export interface ProfileDocumentsSource {
  nationalities: string[];
  approvedVisas: string[];
  passportCountry: string | null;
}

/**
 * A user's profile nationalities and visas as codes: legacy visa names are
 * converted (unresolved ones are dropped, nothing is written back), and empty
 * nationalities fall back to a resolvable `passportCountry`.
 */
export function profileTravelDocuments(
  user: ProfileDocumentsSource,
): TravelerDocuments {
  // Defensive `?? []`: callers may pass a row loaded with a narrower select.
  const nationalities = normalizeCountryCodes(user.nationalities ?? []);
  const prefill = resolveNationalityCode(user.passportCountry);
  return {
    nationalities:
      nationalities.length === 0 && prefill ? [prefill] : nationalities,
    visas: toVisaCodes(user.approvedVisas ?? []).codes,
  };
}

/**
 * "Linked = live": a traveler with an account (the buyer, or a companion row
 * with `userId`) always reads their documents from their profile; the trip
 * row's lists apply only to travelers without an account.
 */
export function effectiveTravelDocuments({
  user,
  row,
}: {
  user?: ProfileDocumentsSource | null;
  row: Partial<TravelerDocuments>;
}): TravelerDocuments {
  if (user) return profileTravelDocuments(user);
  return { nationalities: row.nationalities ?? [], visas: row.visas ?? [] };
}

/**
 * The buyer's view of a trip: `buyerNationalities` / `buyerVisas` carry the
 * buyer's live profile documents (the trip columns are a stale snapshot).
 * Only for the buyer's own payload; companions get `omitBuyerOnlyFields`.
 */
export function withLiveBuyerDocuments<T extends object>(
  trip: T,
  buyer: ProfileDocumentsSource,
): T & { buyerNationalities: string[]; buyerVisas: string[] } {
  const { nationalities, visas } = profileTravelDocuments(buyer);
  return { ...trip, buyerNationalities: nationalities, buyerVisas: visas };
}
