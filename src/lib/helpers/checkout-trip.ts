/** TripRequest statuses that allow continuing to checkout / retry payment. */
export const CHECKOUT_TRIP_STATUSES = new Set([
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
]);

export function pickCheckoutTrip<T extends { status: string; updatedAt: string }>(
  trips: T[],
): T | null {
  if (trips.length === 0) return null;
  const sorted = [...trips].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return sorted.find((t) => CHECKOUT_TRIP_STATUSES.has(t.status)) ?? null;
}
