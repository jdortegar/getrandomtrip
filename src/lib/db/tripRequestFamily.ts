import type { TripRequestStatus } from "@prisma/client";

/**
 * Every non-terminal status a `TripRequest` can be in. A row in one of these
 * statuses counts as the user's "active" trip for its family. `CONFIRMED`,
 * `REVEALED`, `COMPLETED`, and `CANCELLED` are terminal and never block a new
 * active slot. Plain literals (type-checked against the Prisma enum) keep this
 * module free of runtime `@prisma/client` imports, so client code can use it.
 */
export const NON_TERMINAL_TRIP_STATUSES = [
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
] as const satisfies readonly TripRequestStatus[];

/**
 * `TripRequest.type` already has the literal value `"family"` (a journey
 * sub-type). The product-family concept is therefore named `TripFamily` —
 * never bare `family` — to avoid colliding with that field value.
 */
export type TripFamily = "journey" | "xsed";

/**
 * Single source of the family boundary. `xsed` is its own family; every
 * other `type` value (`couple`, `family`, `group`, `solo`, `honeymoon`,
 * `paws`, etc.) is `journey`. Never re-implement `type === "xsed"` inline.
 */
export function tripFamilyOf(type: string | null | undefined): TripFamily {
  return type === "xsed" ? "xsed" : "journey";
}

/**
 * Traveler type (`couple`, `solo`, ...) of a trip. XSED trips store the
 * traveler type in `level` (their `type` is the literal `"xsed"`); every other
 * trip carries it in `type`.
 */
export function travelerTypeOf(trip: {
  type: string;
  level?: string | null;
}): string {
  return tripFamilyOf(trip.type) === "xsed" ? (trip.level ?? "") : trip.type;
}
