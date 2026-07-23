const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  DRAFT: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-400",
  },
  PENDING_REVIEW: {
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  PENDING_TRIPPER_REVIEW: {
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
  },
  PUBLISHED: {
    badge: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
};

interface BlogStatusBadgeProps {
  label: string;
  status: string;
}

export function BlogStatusBadge({ label, status }: BlogStatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();
  const { badge, dot } =
    STATUS_STYLES[normalizedStatus] ?? STATUS_STYLES.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${badge}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
