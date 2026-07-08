import { cn } from "@/lib/utils";
import {
  PAYMENT_STATUS_COLORS,
  TRIP_STATUS_COLORS,
  USER_ROLE_COLORS,
  type StatusColors,
} from "@/lib/admin/trip-status";

interface StatusBadgeProps {
  className?: string;
  label: string;
  status: string;
  variant?: "payment" | "role" | "trip";
}

const FALLBACK: StatusColors = {
  badge: "bg-gray-50 text-gray-700 border-gray-200",
  dot: "bg-gray-400",
};

const COLOR_MAPS: Record<
  NonNullable<StatusBadgeProps["variant"]>,
  Record<string, StatusColors>
> = {
  payment: PAYMENT_STATUS_COLORS,
  role: USER_ROLE_COLORS,
  trip: TRIP_STATUS_COLORS,
};

export function StatusBadge({
  className,
  label,
  status,
  variant = "trip",
}: StatusBadgeProps) {
  const { badge, dot } = COLOR_MAPS[variant][status] ?? FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      {label}
    </span>
  );
}
