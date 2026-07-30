import type { TravelerKind, TravelerStatus } from "@prisma/client";

export type { TravelerKind, TravelerStatus };

/**
 * Serialized shape of a `TripTraveler` row. `serializeTraveler` in
 * `src/lib/travelers/travelerRoster.ts` is the ONLY place a Prisma row is
 * turned into this DTO — never build one inline in a route.
 */
export interface TravelerDTO {
  id: string;
  kind: TravelerKind;
  status: TravelerStatus;
  fullName: string | null;
  email: string | null;
  idDocument: string | null;
  dateOfBirth: string | null;
  invitedAt: string | null;
  submittedAt: string | null;
}

/**
 * Shape returned by `getRosterForTrip`. Consumed identically by the
 * checkout success page and the dashboard trip detail page — no route may
 * build its own version of this shape.
 */
export interface TravelerRoster {
  deadline: string | null;
  locked: boolean;
  cap: number;
  submitted: number;
  travelers: TravelerDTO[];
}
