/**
 * Builds the query string for the assignable-experiences lookup.
 * `ownerActive: "true"` excludes experiences owned by an inactive tripper
 * from the assignment list — GET /api/admin/experiences only applies that
 * owner filter when this flag is present, since the same route also backs
 * admin catalog browsing, which must keep showing inactive owners.
 *
 * Relocated verbatim from `TripRequestModal.tsx` (design.md ADR-8) so it
 * survives that component's deletion. Forwards `trip.type` verbatim — the
 * case-mismatch fix lives on the receiving end
 * (`canonicalizeExperienceTypeFilter`), not here.
 */
export function buildAssignableExperiencesQuery(trip: {
  tripperId: string | null;
  type: string;
}): URLSearchParams {
  const params = new URLSearchParams({ status: "ACTIVE", ownerActive: "true" });
  if (trip.tripperId) params.set("tripperId", trip.tripperId);
  if (trip.type) params.set("type", trip.type);
  return params;
}
