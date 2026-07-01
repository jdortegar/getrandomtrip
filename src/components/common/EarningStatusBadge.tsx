const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  paid: {
    badge: "bg-green-50 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  pending: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-400",
  },
  processing: {
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
};

interface EarningStatusBadgeProps {
  label: string;
  status: string;
}

export function EarningStatusBadge({ label, status }: EarningStatusBadgeProps) {
  const { badge, dot } = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${badge}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
