import { prisma } from "@/lib/prisma";
import type { TravelerKind } from "@prisma/client";
import type { TravelerDTO, TravelerRoster } from "@/types/traveler";
import { tripRoleFor } from "./travelerAccess";

import {
  computeTravelerCap,
  getRosterCutoffAt,
  isTravelerRosterComplete,
} from "./travelerPolicy";
export { computeTravelerCap, ROSTER_CUTOFF_MS } from "./travelerPolicy";

/**
 * The cutoff protects populated fields only. For XSED, legacy T-7d stamps
 * must not override the new T-72h policy; no customer-data repair is needed.
 */
export function isRosterLocked(trip: {
  type?: string;
  startDate: Date | null;
  departureTimeZone?: string | null;
  travelersLockedAt: Date | null;
}): boolean {
  if (trip.type?.trim().toLowerCase() !== "xsed" && trip.travelersLockedAt != null) return true;
  if (!trip.startDate) return false;
  return Date.now() >= getRosterCutoffAt({ ...trip, startDate: trip.startDate }).getTime();
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
  userId?: string | null;
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
    joined: Boolean(row.userId),
  };
}

/**
 * Companion view of a row: the viewer's own row stays complete (flagged
 * `isSelf`); every other traveler is reduced to their name — no email, ID
 * document, date of birth, invite or account-link information. Filtering
 * happens here, server-side; the UI never receives what it must hide.
 */
export function serializeTravelerForCompanion(
  row: SerializableTravelerRow,
  viewerUserId: string,
): TravelerDTO {
  if (row.userId && row.userId === viewerUserId) {
    return { ...serializeTraveler(row), isSelf: true };
  }
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    fullName: row.fullName,
    email: null,
    idDocument: null,
    dateOfBirth: null,
    invitedAt: null,
    submittedAt: null,
    joined: false,
  };
}

/**
 * Shared read path for both the checkout success page and the dashboard
 * trip detail page. Ensures the roster exists (lazy, idempotent, paid-gated)
 * then serializes it — the single drift-proof shape. The viewer decides the
 * shape: the buyer gets every row in full; a companion gets the reduced view
 * (see `serializeTravelerForCompanion`). The viewer is required so no read
 * surface can forget to choose.
 */
export async function getRosterForTrip(
  tripId: string,
  viewerUserId: string,
): Promise<TravelerRoster> {
  await ensureRoster(tripId);

  const trip = await prisma.tripRequest.findUnique({
    where: { id: tripId },
    include: { travelers: { orderBy: { createdAt: "asc" } } },
  });

  if (!trip) {
    return {
      deadline: null,
      startDate: null,
      locked: false,
      cap: 0,
      submitted: 0,
      travelers: [],
    };
  }

  const deadline = trip.startDate
    ? getRosterCutoffAt({ ...trip, startDate: trip.startDate }).toISOString()
    : null;
  const startDate = trip.startDate ? trip.startDate.toISOString() : null;
  const locked = isRosterLocked(trip);
  const viewerRole = tripRoleFor(trip, viewerUserId);
  // Progress is a trip-level fact computed from the full rows, so a companion
  // sees the same count the buyer does without the data behind it.
  const submitted = trip.travelers
    .map(serializeTraveler)
    .filter(isTravelerRosterComplete).length;
  const travelers =
    viewerRole === "companion"
      ? trip.travelers.map((row) => serializeTravelerForCompanion(row, viewerUserId))
      : trip.travelers.map(serializeTraveler);

  return {
    deadline,
    startDate,
    locked,
    cap: travelers.length,
    submitted,
    travelers,
    viewerRole,
  };
}
