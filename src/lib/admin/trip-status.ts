export type TripRequestStatus =
  | "DRAFT"
  | "SAVED"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "REVEALED"
  | "COMPLETED"
  | "CANCELLED";

export const TRIP_STATUS_FLOW: TripRequestStatus[] = [
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
  "COMPLETED",
];

/** Badge colors in the shared rounded-[6px] + dot shape (see StatusBadge, ExperienceStatusBadge). */
export interface StatusColors {
  badge: string;
  dot: string;
}

export const TRIP_STATUS_COLORS: Record<TripRequestStatus, StatusColors> = {
  CANCELLED: { badge: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500" },
  COMPLETED: {
    badge: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  CONFIRMED: {
    badge: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  DRAFT: {
    badge: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  PENDING_PAYMENT: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-400",
  },
  REVEALED: {
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  SAVED: {
    badge: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
};

export const PAYMENT_STATUS_COLORS: Record<string, StatusColors> = {
  APPROVED: {
    badge: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  CANCELLED: {
    badge: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  COMPLETED: {
    badge: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  FAILED: { badge: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500" },
  PENDING: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-400",
  },
  REFUNDED: {
    badge: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
};

export const USER_ROLE_COLORS: Record<"ADMIN" | "CLIENT" | "TRIPPER", StatusColors> = {
  ADMIN: {
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
  },
  CLIENT: {
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  TRIPPER: {
    badge: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
};

const ALL_TRIP_STATUSES: TripRequestStatus[] = [...TRIP_STATUS_FLOW, "CANCELLED"];

/**
 * Resolves the initial trip-request status filter from a `?status=` query
 * param (e.g. the admin overview's "needs destination assignment" pending
 * row deep-links to `?status=CONFIRMED`). Falls back to `"ALL"` when the
 * param is absent or not a recognized `TripRequestStatus`.
 */
export function resolveInitialStatusFilter(
  param: string | null,
): TripRequestStatus | "ALL" {
  if (param && (ALL_TRIP_STATUSES as string[]).includes(param)) {
    return param as TripRequestStatus;
  }
  return "ALL";
}

export function countTripsByStatus(
  trips: { status: TripRequestStatus }[],
): Record<TripRequestStatus, number> {
  const all: TripRequestStatus[] = [...TRIP_STATUS_FLOW, "CANCELLED"];
  const counts = Object.fromEntries(all.map((s) => [s, 0])) as Record<
    TripRequestStatus,
    number
  >;
  for (const trip of trips) {
    if (trip.status in counts) counts[trip.status]++;
  }
  return counts;
}
