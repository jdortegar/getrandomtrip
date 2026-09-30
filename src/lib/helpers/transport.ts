export function normalizeTransportId(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  return raw;
}

export const OWN_CAR_TRANSPORT = "own-car";

/** XSED includes no transport; journey preferences retain their existing default. */
export function resolveTripTransport(
  type: string | null | undefined,
  transport: string | null | undefined,
): string {
  return type === "xsed"
    ? OWN_CAR_TRANSPORT
    : normalizeTransportId(transport) || "plane";
}

/** Apply the same product policy to legacy rows without changing stored data. */
export function resolveTripTransportLabel(
  type: string | null | undefined,
  transport: string | null | undefined,
  ownCarLabel: string,
  regularLabel: string | undefined,
): string | undefined {
  return resolveTripTransport(type, transport) === OWN_CAR_TRANSPORT
    ? ownCarLabel
    : regularLabel;
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
    .split(",")
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
  return normalizeTransportId(first) ?? "plane";
}

/** Primary mode for display when the URL has a full order; otherwise undefined. */
export function getOptionalPrimaryTransportFromOrderParam(
  raw: string | null | undefined,
): string | undefined {
  if (!isCompleteTransportOrderParam(raw)) return undefined;
  const first = parseTransportOrderParam(raw)[0];
  return normalizeTransportId(first);
}
