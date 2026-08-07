export interface StatusIndicatorStyle {
  badge: string;
  dot: string;
}

interface StatusIndicatorBadgeProps {
  label: string;
  styles: StatusIndicatorStyle;
}

/**
 * Shared rendering for the rounded-[6px]+dot status indicator, canonical
 * for the "read-only status" badge role (see design-system.md). Each
 * status-family badge (Experience/Blog/Earning/Traveler) keeps its own
 * color map and fallback logic, and just renders through this.
 */
export function StatusIndicatorBadge({ label, styles }: StatusIndicatorBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${styles.badge}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}
