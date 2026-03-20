export function normalizeTransportId(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  return raw;
}

export function normalizeMaxTravelTimeKey(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  return raw;
}

export function normalizeJourneyFilterValue(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  return raw;
}

const TRANSPORT_ORDER_SEGMENT_COUNT = 4;

/**
 * Parses `transportOrder` query value (comma-separated ids, e.g. plane,train,bus,ship).
 */
export function parseTransportOrderParam(
  raw: string | null | undefined,
): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .map((id) => normalizeTransportId(id))
    .filter((id): id is string => Boolean(id));
}

/** Whether the URL has a full preference order (four modes). */
export function isCompleteTransportOrderParam(
  raw: string | null | undefined,
): boolean {
  return parseTransportOrderParam(raw).length === TRANSPORT_ORDER_SEGMENT_COUNT;
}

/**
 * Primary transport mode: first id in `transportOrder`.
 * Falls back to `plane` when missing (API / store defaults).
 */
export function getPrimaryTransportIdFromOrderParam(
  raw: string | null | undefined,
): string {
  const first = parseTransportOrderParam(raw)[0];
  return normalizeTransportId(first) ?? 'plane';
}

/** Primary mode for display when the URL has a full order; otherwise undefined. */
export function getOptionalPrimaryTransportFromOrderParam(
  raw: string | null | undefined,
): string | undefined {
  if (!isCompleteTransportOrderParam(raw)) return undefined;
  const first = parseTransportOrderParam(raw)[0];
  return normalizeTransportId(first);
}

