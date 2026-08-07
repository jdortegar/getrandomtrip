import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

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
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

  return <StatusIndicatorBadge label={label} styles={styles} />;
}
