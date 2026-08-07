import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

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
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;

  return <StatusIndicatorBadge label={label} styles={styles} />;
}
