/**
 * Pure helpers for `TripSupportModal` (design.md ADR-4). `POST /api/contact`
 * accepts only `name/email/interest/message` (Resolved Decision #4 forbids
 * widening it), so trip context is appended to `message` rather than sent
 * as a separate field.
 */

export interface TripSupportContext {
  destination: string | null;
  startDate: string | null;
  tripId: string;
}

/**
 * Ops-facing footer appended to the traveler's message. The human message
 * always comes first — the ops reader wants that, not the metadata.
 * Null-valued lines (destination/startDate) are omitted; `tripId` is
 * always present.
 */
export function buildTripSupportMessage(
  message: string,
  ctx: TripSupportContext,
): string {
  const lines = [`Trip ID: ${ctx.tripId}`];
  if (ctx.destination) lines.push(`Destination: ${ctx.destination}`);
  if (ctx.startDate) lines.push(`Departure: ${ctx.startDate}`);

  return `${message}\n\n---\n${lines.join("\n")}`;
}

/** Send is enabled only when the message carries real content and isn't already in flight. */
export function canSendTripSupport(message: string, sending: boolean): boolean {
  return !sending && message.trim().length > 0;
}
