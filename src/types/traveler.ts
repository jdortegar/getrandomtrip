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
  /** True once the companion linked an account (`TripTraveler.userId` set). The user id itself is never exposed. */
  joined: boolean;
  /**
   * Set only in a companion's view of the roster, on the row that is the
   * viewer's own. Other rows in that view carry names only.
   */
  isSelf?: true;
}

/**
 * Shape returned by `getRosterForTrip`. Consumed identically by the
 * checkout success page and the dashboard trip detail page — no route may
 * build its own version of this shape.
 */
export interface TravelerRoster {
  deadline: string | null;
  /** Trip's actual departure date (`TripRequest.startDate`) — the roster
   * lock `deadline` is 72 hours (XSED) or 7 days *before* this, so callers computing
   * days-until-departure must use this field, not `deadline`. */
  startDate: string | null;
  locked: boolean;
  cap: number;
  submitted: number;
  travelers: TravelerDTO[];
  /**
   * Who the roster was built for. A `companion` view is read-only apart from
   * the viewer's own row and omits other travelers' email, ID document and
   * date of birth. Absent means `buyer`.
   */
  viewerRole?: "buyer" | "companion";
}
