import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

interface StatusBadgeProps {
  label: string;
  status: string;
  variant?: "payment" | "role" | "trip";
}

export function StatusBadge({
  label,
  status,
  variant = "trip",
}: StatusBadgeProps) {
  return (
    <StatusIndicatorBadge family={variant} label={label} status={status} />
  );
}
