import type { TravelerStatus } from "@/types/traveler";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

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
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;

  return <StatusIndicatorBadge label={label} styles={styles} />;
}
