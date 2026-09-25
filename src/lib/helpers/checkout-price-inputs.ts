/** Fields currently read by checkout's base-price, multiplier and totals rules.
 * Rooms, dates and contact/origin metadata do not change the current charge. */
export const CHECKOUT_PRICE_SELECT = {
  type: true,
  level: true,
  pax: true,
  transport: true,
  accommodationType: true,
  climate: true,
  maxTravelTime: true,
  departPref: true,
  arrivePref: true,
  avoidDestinations: true,
  addons: true,
  tripperId: true,
} as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value))
    return value
      .map(stableValue)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  return value;
}

/** Compare the merged, normalized update, not which keys happened to be sent. */
export function checkoutPriceInputsChanged(before: object, update: object) {
  const previous = before as Record<string, unknown>;
  const changes = update as Record<string, unknown>;
  return Object.keys(CHECKOUT_PRICE_SELECT).some(
    (key) =>
      Object.prototype.hasOwnProperty.call(changes, key) &&
      JSON.stringify(stableValue(previous[key])) !==
        JSON.stringify(stableValue(changes[key])),
  );
}
