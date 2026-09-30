import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

interface EarningStatusBadgeProps {
  label: string;
  status: string;
}

export function EarningStatusBadge({ label, status }: EarningStatusBadgeProps) {
  return (
    <StatusIndicatorBadge family="earning" label={label} status={status} />
  );
}
