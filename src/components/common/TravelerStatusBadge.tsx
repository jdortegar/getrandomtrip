import type { TravelerStatus } from "@/types/traveler";

const STATUS_STYLES: Record<TravelerStatus, { dot: string; badge: string }> = {
  PENDING: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  INVITED: {
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
  },
  COMPLETE: {
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-800 border-green-200",
  },
};

interface TravelerStatusBadgeProps {
  status: TravelerStatus;
  label: string;
}

export function TravelerStatusBadge({
  status,
  label,
}: TravelerStatusBadgeProps) {
  const { dot, badge } = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${badge}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
