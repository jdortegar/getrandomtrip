import type { TripRequestStatus } from "./trip-status";

/** `xsed` covers TGIS-drop trip requests — a real, distinct `type` value
 * alongside the five traveler-party types (verified against production
 * data: `TripRequest.type` groups into exactly these six). */
export const TRIP_REQUEST_TYPES = [
  "solo",
  "couple",
  "family",
  "group",
  "honeymoon",
  "paws",
  "xsed",
] as const;
export type TripRequestType = (typeof TRIP_REQUEST_TYPES)[number];

/** `xsed` is also a real `level` value for TGIS-drop trip requests — those
 * rows don't carry one of the five paid-tier levels (verified against
 * production data). */
export const TRIP_REQUEST_LEVELS = [
  "essenza",
  "modo-explora",
  "explora-plus",
  "bivouac",
  "atelier-getaway",
  "xsed",
] as const;
export type TripRequestLevel = (typeof TRIP_REQUEST_LEVELS)[number];

/** `Payment.status` values reachable from the admin UI. Mirrors the keys
 * already localized under `dashboard.paymentStatus`. */
export const TRIP_PAYMENT_STATUS_VALUES = [
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REJECTED",
  "IN_PROCESS",
] as const;
export type TripPaymentStatusFilter =
  | (typeof TRIP_PAYMENT_STATUS_VALUES)[number]
  | "NO_PAYMENT";

export function isTripRequestType(value: string): value is TripRequestType {
  return (TRIP_REQUEST_TYPES as readonly string[]).includes(value);
}

export function isTripRequestLevel(value: string): value is TripRequestLevel {
  return (TRIP_REQUEST_LEVELS as readonly string[]).includes(value);
}

export function isTripPaymentStatusFilter(
  value: string,
): value is TripPaymentStatusFilter {
  return (
    value === "NO_PAYMENT" ||
    (TRIP_PAYMENT_STATUS_VALUES as readonly string[]).includes(value)
  );
}

interface BuildTripRequestsWhereParams {
  level?: TripRequestLevel;
  paymentStatus?: TripPaymentStatusFilter;
  search?: string;
  status?: TripRequestStatus;
  type?: TripRequestType;
}

/** Builds the `where` clause for the admin trip-requests list, composing
 * independent filter dimensions (status/type/level/payment/search-by-traveler)
 * so each can be tested and reasoned about on its own. */
export function buildTripRequestsWhere({
  level,
  paymentStatus,
  search,
  status,
  type,
}: BuildTripRequestsWhereParams) {
  return {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(level ? { level } : {}),
    ...(paymentStatus === "NO_PAYMENT"
      ? { payment: null }
      : paymentStatus
        ? { payment: { status: paymentStatus } }
        : {}),
    ...(search
      ? {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };
}
