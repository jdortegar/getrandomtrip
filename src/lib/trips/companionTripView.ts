/**
 * Fields a companion (a linked traveler who is not the buyer) must never
 * receive: what the buyer paid, the price the trip resolves to, and any raw
 * traveler rows (the sanitized `roster` is the only traveler data they get).
 * Removed on the server, not hidden in the UI.
 */
const BUYER_ONLY_KEYS = ["payment", "basePriceUsd", "travelers"] as const;

/** Drops buyer-only fields from a trip payload for a companion viewer. */
export function omitBuyerOnlyFields<T extends Record<string, unknown>>(
  trip: T,
): Omit<T, (typeof BUYER_ONLY_KEYS)[number]> {
  const copy: Record<string, unknown> = { ...trip };
  for (const key of BUYER_ONLY_KEYS) delete copy[key];
  return copy as Omit<T, (typeof BUYER_ONLY_KEYS)[number]>;
}
