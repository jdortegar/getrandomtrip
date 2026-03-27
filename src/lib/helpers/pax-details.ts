import type { PaxDetails } from '@/lib/types/PaxDetails';

export const DEFAULT_PAX_DETAILS: PaxDetails = {
  adults: 1,
  minors: 0,
  rooms: 1,
};

export function parsePaxDetails(value: unknown): PaxDetails | null {
  if (value == null || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  const adults = Number(o.adults);
  const minors = Number(o.minors);
  const rooms = Number(o.rooms);
  if (!Number.isFinite(adults) || !Number.isFinite(minors) || !Number.isFinite(rooms)) {
    return null;
  }
  const a = Math.floor(adults);
  const m = Math.floor(minors);
  const r = Math.floor(rooms);
  if (a < 1 || m < 0 || r < 1) return null;
  return { adults: a, minors: m, rooms: r };
}

export function paxDetailsFromTotalPax(totalPax: number): PaxDetails {
  const p = Math.max(1, Math.floor(totalPax));
  return { adults: p, minors: 0, rooms: 1 };
}

export function paxDetailsEquals(a: PaxDetails, b: unknown): boolean {
  const parsed = parsePaxDetails(b);
  if (!parsed) return false;
  return (
    parsed.adults === a.adults &&
    parsed.minors === a.minors &&
    parsed.rooms === a.rooms
  );
}
