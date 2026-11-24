import { cn } from "@/lib/utils";

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

const TONES = {
  success: {
    badge: "bg-green-50 border-green-200 text-green-800",
    dot: "bg-green-500",
  },
  warning: {
    badge: "bg-amber-50 border-amber-200 text-amber-800",
    dot: "bg-amber-400",
  },
  unread: { badge: "bg-sky-50 border-sky-200 text-sky-700", dot: "bg-sky-500" },
  info: { badge: "bg-sky-50 border-sky-200 text-sky-800", dot: "bg-sky-500" },
  review: {
    badge: "bg-purple-50 border-purple-200 text-purple-800",
    dot: "bg-purple-500",
  },
  danger: { badge: "bg-red-50 border-red-200 text-red-800", dot: "bg-red-500" },
  inactive: {
    badge: "bg-neutral-50 border-neutral-200 text-neutral-600",
    dot: "bg-neutral-400",
  },
  neutral: {
    badge: "bg-gray-50 border-gray-200 text-gray-700",
    dot: "bg-gray-400",
  },
  booked: {
    badge: "bg-blue-50 border-blue-200 text-blue-800",
    dot: "bg-blue-500",
  },
  // Brand tones: traveler-facing surfaces built on the brand palette, where
  // generic Tailwind hues clash. Text stays Deep Teal or Ink for AA contrast;
  // Sage and Ochre are too light for text and only tint the wash and dot.
  brandSage: {
    badge: "bg-secondary/35 border-secondary text-primary",
    dot: "bg-primary/50",
  },
  brandOchre: {
    badge: "bg-feature/15 border-feature/50 text-ink",
    dot: "bg-feature",
  },
  brandTeal: {
    badge: "bg-primary/10 border-primary/25 text-primary",
    dot: "bg-primary",
  },
  brandGround: {
    badge: "bg-ground border-gray-200 text-neutral-600",
    dot: "bg-neutral-400",
  },
};
interface StatusFamily {
  fallback: keyof typeof TONES;
  statuses: Record<string, keyof typeof TONES>;
}
const TRAVELER_TRIP: StatusFamily = {
  fallback: "brandGround",
  statuses: {
    CANCELLED: "danger",
    COMPLETED: "brandTeal",
    CONFIRMED: "brandSage",
    REVEALED: "brandOchre",
  },
};
const TRIPPER_BOOKING: StatusFamily = {
  fallback: "warning",
  statuses: { confirmed: "success", completed: "success", revealed: "review" },
};
const FAMILIES: Record<StatusIndicatorBadgeProps["family"], StatusFamily> = {
  notification: { fallback: "unread", statuses: {} },
  review: { fallback: "warning", statuses: { submitted: "success" } },
  "tripper-booking": TRIPPER_BOOKING,
  "tripper-booking-summary": TRIPPER_BOOKING,
  "tripper-profile": {
    fallback: "warning",
    statuses: {
      APPROVED: "success",
      CHANGES_REQUESTED: "danger",
      DRAFT: "warning",
      PENDING_REVIEW: "info",
    },
  },
  availability: { fallback: "inactive", statuses: {} },
  blog: {
    fallback: "warning",
    statuses: {
      DRAFT: "brandOchre",
      PENDING_REVIEW: "brandSage",
      PENDING_TRIPPER_REVIEW: "brandTeal",
      PUBLISHED: "success",
    },
  },
  document: { fallback: "warning", statuses: { published: "success" } },
  "email-campaign": {
    fallback: "warning",
    statuses: {
      DRAFT: "warning",
      PARTIAL: "danger",
      SENDING: "info",
      SENT: "success",
    },
  },
  "email-send": {
    fallback: "inactive",
    statuses: {
      BOUNCED: "danger",
      DELIVERED: "success",
      FAILED: "danger",
      QUEUED: "inactive",
      SENT: "info",
    },
  },
  "email-contact": {
    fallback: "inactive",
    statuses: {
      BOUNCED: "danger",
      SUBSCRIBED: "success",
      UNSUBSCRIBED: "inactive",
    },
  },
  earning: {
    fallback: "warning",
    statuses: { paid: "success", pending: "warning", processing: "info" },
  },
  experience: {
    fallback: "warning",
    statuses: {
      ACTIVE: "success",
      ARCHIVED: "brandGround",
      DRAFT: "brandOchre",
      INACTIVE: "danger",
      PENDING_REVIEW: "brandSage",
      PENDING_TRIPPER_REVIEW: "brandTeal",
    },
  },
  payment: {
    fallback: "neutral",
    statuses: {
      APPROVED: "success",
      CANCELLED: "neutral",
      COMPLETED: "success",
      FAILED: "danger",
      PENDING: "warning",
      REFUNDED: "neutral",
      REJECTED: "danger",
    },
  },
  role: {
    fallback: "neutral",
    statuses: { ADMIN: "review", TRAVELER: "booked", TRIPPER: "success" },
  },
  traveler: {
    fallback: "warning",
    statuses: { COMPLETE: "success", INVITED: "info", PENDING: "warning" },
  },
  "traveler-trip": TRAVELER_TRIP,
  "traveler-trip-summary": TRAVELER_TRIP,
  trip: {
    fallback: "neutral",
    statuses: {
      CANCELLED: "danger",
      COLLECTING: "warning",
      COMPLETED: "success",
      CONFIRMED: "success",
      DRAFT: "neutral",
      PENDING_PAYMENT: "warning",
      REVEALED: "info",
      SAVED: "neutral",
    },
  },
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
