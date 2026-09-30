import { TripRequestStatus } from "@prisma/client";

/**
 * Every non-terminal status a `TripRequest` can be in. A row in one of these
 * statuses counts as the user's "active" trip for its family. `CONFIRMED`,
 * `REVEALED`, `COMPLETED`, and `CANCELLED` are terminal and never block a new
 * active slot.
 */
export const NON_TERMINAL_TRIP_STATUSES = [
  TripRequestStatus.DRAFT,
  TripRequestStatus.SAVED,
  TripRequestStatus.PENDING_PAYMENT,
] as const;

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
