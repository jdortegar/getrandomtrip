import { prisma } from "@/lib/prisma";
import type { TravelerKind } from "@prisma/client";
import type { TravelerDTO, TravelerRoster } from "@/types/traveler";

/** Cutoff = trip start date minus 7 days (confirmed decision). */
export const ROSTER_CUTOFF_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Defensive read of `TripRequest.paxDetails` — missing or non-numeric
 * `adults`/`minors` are treated as `0` rather than erroring. Row counts are
 * fixed at payment success: one row per companion, i.e. `adults - 1` adult
 * rows (the buyer themselves is not a row) and `minors` minor rows.
 */
export function computeTravelerCap(
  paxDetails: unknown,
): { adultRows: number; minorRows: number } {
  const raw =
    paxDetails && typeof paxDetails === "object"
      ? (paxDetails as Record<string, unknown>)
      : {};

  const adults = typeof raw.adults === "number" && Number.isFinite(raw.adults) ? raw.adults : 0;
  const minors = typeof raw.minors === "number" && Number.isFinite(raw.minors) ? raw.minors : 0;

  return {
    adultRows: Math.max(0, adults - 1),
    minorRows: Math.max(0, minors),
  };
}

/**
 * Locked when either the cutoff pass has already stamped
 * `travelersLockedAt`, or `now >= startDate - 7d` (inclusive boundary).
 */
export function isRosterLocked(trip: {
  startDate: Date | null;
  travelersLockedAt: Date | null;
}): boolean {
  if (trip.travelersLockedAt != null) return true;
  if (!trip.startDate) return false;
  return Date.now() >= trip.startDate.getTime() - ROSTER_CUTOFF_MS;
}

/**
 * Lazily materializes the fixed-size roster for a paid trip. No-op unless
 * the trip's payment is APPROVED. Idempotent — only creates the rows that
 * are still missing relative to `computeTravelerCap`; existing rows are
 * never touched, added to, or removed.
 */
export async function ensureRoster(tripId: string): Promise<void> {
  const trip = await prisma.tripRequest.findUnique({
    where: { id: tripId },
    include: { payment: true, travelers: true },
  });

  if (!trip || trip.payment?.status !== "APPROVED") return;

  const { adultRows, minorRows } = computeTravelerCap(trip.paxDetails);
  const existingAdults = trip.travelers.filter(
    (t: { kind: TravelerKind }) => t.kind === "ADULT",
  ).length;
  const existingMinors = trip.travelers.filter(
    (t: { kind: TravelerKind }) => t.kind === "MINOR",
  ).length;

  const toCreate: { tripRequestId: string; kind: TravelerKind }[] = [];
  for (let i = existingAdults; i < adultRows; i++) {
    toCreate.push({ tripRequestId: tripId, kind: "ADULT" });
  }
  for (let i = existingMinors; i < minorRows; i++) {
    toCreate.push({ tripRequestId: tripId, kind: "MINOR" });
  }

  if (toCreate.length > 0) {
    await prisma.tripTraveler.createMany({ data: toCreate });
  }
}

type SerializableTravelerRow = {
  id: string;
  kind: TravelerDTO["kind"];
  status: TravelerDTO["status"];
  fullName: string | null;
  email: string | null;
  idDocument: string | null;
  dateOfBirth: Date | null;
  invitedAt: Date | null;
  submittedAt: Date | null;
};

/**
 * The ONE place a `TripTraveler` row becomes a `TravelerDTO`. Both read
 * routes (`trip-summary`, `/api/trips/[id]`) must go through
 * `getRosterForTrip`, which calls this — no route may build a traveler
 * object inline.
 */
export function serializeTraveler(row: SerializableTravelerRow): TravelerDTO {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    fullName: row.fullName,
    email: row.email,
    idDocument: row.idDocument,
    dateOfBirth: row.dateOfBirth ? row.dateOfBirth.toISOString() : null,
    invitedAt: row.invitedAt ? row.invitedAt.toISOString() : null,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
  };
}

/**
 * Shared read path for both the checkout success page and the dashboard
 * trip detail page. Ensures the roster exists (lazy, idempotent, paid-gated)
 * then serializes it — the single drift-proof shape.
 */
export async function getRosterForTrip(tripId: string): Promise<TravelerRoster> {
  await ensureRoster(tripId);

  const trip = await prisma.tripRequest.findUnique({
    where: { id: tripId },
    include: { travelers: { orderBy: { createdAt: "asc" } } },
  });

  if (!trip) {
    return { deadline: null, locked: false, cap: 0, submitted: 0, travelers: [] };
  }

  const deadline = trip.startDate
    ? new Date(trip.startDate.getTime() - ROSTER_CUTOFF_MS).toISOString()
    : null;
  const locked = isRosterLocked(trip);
  const travelers = trip.travelers.map(serializeTraveler);
  const submitted = travelers.filter((t) => t.status === "COMPLETE").length;

  return { deadline, locked, cap: travelers.length, submitted, travelers };
}
