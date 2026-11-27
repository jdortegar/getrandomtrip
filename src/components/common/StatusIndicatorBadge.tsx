import { cn } from "@/lib/utils";
import { BADGE_TONES } from "@/components/ui/badgeTones";

interface StatusIndicatorBadgeProps {
  family:
    | "blog"
    | "experience"
    | "earning"
    | "traveler"
    | "trip"
    | "payment"
    | "role"
    | "traveler-trip"
    | "traveler-trip-summary"
    | "document"
    | "availability"
    | "email-contact"
    | "email-campaign"
    | "email-send"
    | "tripper-booking"
    | "tripper-booking-summary"
    | "tripper-profile"
    | "notification"
    | "review";
  label: string;
  status: string;
}

const TONES = BADGE_TONES;
interface StatusFamily {
  fallback: keyof typeof TONES;
  statuses: Record<string, keyof typeof TONES>;
}
/** Trip lifecycle, shared by traveler and admin views so a status reads the same everywhere. */
const TRIP_LIFECYCLE: Record<string, keyof typeof TONES> = {
  CANCELLED: "danger",
  COLLECTING: "ochre",
  COMPLETED: "teal",
  CONFIRMED: "sage",
  DRAFT: "ground",
  PENDING_PAYMENT: "ochre",
  REVEALED: "ochre",
  SAVED: "ground",
};
const TRAVELER_TRIP: StatusFamily = {
  fallback: "ground",
  // Travelers waiting on their group aren't being asked to act, so stay calm.
  statuses: { ...TRIP_LIFECYCLE, COLLECTING: "ground" },
};
const TRIPPER_BOOKING: StatusFamily = {
  fallback: "ground",
  statuses: { completed: "teal", confirmed: "sage", revealed: "ochre" },
};
const FAMILIES: Record<StatusIndicatorBadgeProps["family"], StatusFamily> = {
  notification: { fallback: "sage", statuses: {} },
  review: { fallback: "ochre", statuses: { submitted: "success" } },
  "tripper-booking": TRIPPER_BOOKING,
  "tripper-booking-summary": TRIPPER_BOOKING,
  "tripper-profile": {
    fallback: "ochre",
    statuses: {
      APPROVED: "success",
      CHANGES_REQUESTED: "danger",
      DRAFT: "ochre",
      PENDING_REVIEW: "sage",
    },
  },
  availability: { fallback: "ground", statuses: {} },
  blog: {
    fallback: "ochre",
    statuses: {
      DRAFT: "ochre",
      PENDING_REVIEW: "sage",
      PENDING_TRIPPER_REVIEW: "teal",
      PUBLISHED: "success",
    },
  },
  document: { fallback: "ochre", statuses: { published: "success" } },
  "email-campaign": {
    fallback: "ochre",
    statuses: {
      DRAFT: "ochre",
      PARTIAL: "danger",
      SENDING: "sage",
      SENT: "success",
    },
  },
  "email-send": {
    fallback: "ground",
    statuses: {
      BOUNCED: "danger",
      DELIVERED: "success",
      FAILED: "danger",
      QUEUED: "ground",
      SENT: "sage",
    },
  },
  "email-contact": {
    fallback: "ground",
    statuses: {
      BOUNCED: "danger",
      SUBSCRIBED: "success",
      UNSUBSCRIBED: "ground",
    },
  },
  earning: {
    fallback: "ochre",
    statuses: { paid: "success", pending: "ochre", processing: "sage" },
  },
  experience: {
    fallback: "ochre",
    statuses: {
      ACTIVE: "success",
      ARCHIVED: "ground",
      DRAFT: "ochre",
      INACTIVE: "danger",
      PENDING_REVIEW: "sage",
      PENDING_TRIPPER_REVIEW: "teal",
    },
  },
  payment: {
    fallback: "ground",
    statuses: {
      APPROVED: "success",
      CANCELLED: "ground",
      COMPLETED: "success",
      FAILED: "danger",
      PENDING: "ochre",
      REFUNDED: "ground",
      REJECTED: "danger",
    },
  },
  role: {
    fallback: "ground",
    statuses: { ADMIN: "teal", TRAVELER: "sage", TRIPPER: "ochre" },
  },
  traveler: {
    fallback: "ochre",
    statuses: { COMPLETE: "success", INVITED: "sage", PENDING: "ochre" },
  },
  "traveler-trip": TRAVELER_TRIP,
  "traveler-trip-summary": TRAVELER_TRIP,
  trip: { fallback: "ground", statuses: TRIP_LIFECYCLE },
};

/** Canonical read-only status + dot. Domain state selects component-owned styling. */
export function StatusIndicatorBadge({
  family,
  label,
  status,
}: StatusIndicatorBadgeProps) {
  const config = FAMILIES[family];
  const tone = Object.hasOwn(config.statuses, status)
    ? config.statuses[status]
    : config.fallback;
  const { badge, dot } = TONES[tone];
  return (
    <span
      className={cn(
        "border font-semibold gap-1.5 inline-flex items-center rounded-[6px] uppercase",
        family === "traveler-trip-summary"
          ? "px-2 py-0.5 text-[10px]"
          : family === "tripper-booking"
            ? "px-3 py-[5px] text-[11px]"
            : "px-2.5 py-1 text-[11px]",
        family === "tripper-booking-summary" && "shrink-0",
        family === "availability" ? "tracking-wide" : "tracking-[0.08em]",
        badge,
      )}
      data-component="StatusIndicatorBadge"
    >
      <span className={cn("h-1.5 rounded-full shrink-0 w-1.5", dot)} />
      {label}
    </span>
  );
}
