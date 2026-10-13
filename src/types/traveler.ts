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
   * ISO 3166-1 alpha-2 codes. Present in the buyer view and on a companion's
   * own row; omitted for other travelers in a companion's view.
   */
  nationalities?: string[];
  /** ISO 3166-1 alpha-2 codes plus visa zone codes (e.g. `SCHENGEN`). Same visibility as `nationalities`. */
  visas?: string[];
  /**
   * Set only in a companion's view of the roster, on the row that is the
   * viewer's own. Other rows in that view carry names only.
   */
  isSelf?: true;
}

/** A traveler's nationalities and visas, as stored on `TripTraveler`. */
export interface TravelerDocuments {
  /** ISO 3166-1 alpha-2 codes. */
  nationalities: string[];
  /** ISO 3166-1 alpha-2 codes plus visa zone codes; empty means none. */
  visas: string[];
}

/**
 * Travel documents the invite form starts from. A populated field is frozen
 * (`*Locked`) once the roster cutoff passed, like every other roster field.
 */
export interface TravelerInviteDocuments extends TravelerDocuments {
  nationalitiesLocked: boolean;
  visasLocked: boolean;
}

/**
 * Result of validating optional `nationalities` / `visas` code lists from a
 * request body. An `undefined` list means "leave the field unchanged".
 */
export type TravelerDocumentCodesResult =
  | { ok: true; nationalities?: string[]; visas?: string[] }
  | { ok: false; error: string; invalid: string[] };

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
