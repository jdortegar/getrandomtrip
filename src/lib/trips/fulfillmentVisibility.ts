/**
 * Founder decision 2026-08-10: CANCELLED is INCLUDED. An already-issued
 * voucher is evidence a traveler may need for a refund/cancellation
 * dispute, and a cancelled trip has no future surprise left to protect.
 * This Set is read against CURRENT status only — history-independent by
 * construction (design.md ADR-6).
 */
export const FULFILLMENT_VISIBLE_STATUSES = new Set([
  "REVEALED",
  "COMPLETED",
  "CANCELLED",
]);

/** Admins are exempt (they author pre-reveal). Everyone else is status-gated. */
export function isFulfillmentVisible(status: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return FULFILLMENT_VISIBLE_STATUSES.has(status);
}
