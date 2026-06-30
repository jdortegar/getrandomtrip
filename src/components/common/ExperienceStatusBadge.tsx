const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  ACTIVE: {
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-800 border-green-200",
  },
  DRAFT: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  PENDING_REVIEW: {
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
  },
  PENDING_TRIPPER_REVIEW: {
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-800 border-purple-200",
  },
  INACTIVE: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-800 border-red-200",
  },
  ARCHIVED: {
    dot: "bg-neutral-400",
    badge: "bg-neutral-50 text-neutral-600 border-neutral-200",
  },
};

interface ExperienceStatusBadgeProps {
  status: string;
  label: string;
}

export function ExperienceStatusBadge({
  status,
  label,
}: ExperienceStatusBadgeProps) {
  const { dot, badge } = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${badge}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
