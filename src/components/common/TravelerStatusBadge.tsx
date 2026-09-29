import type { TravelerStatus } from "@/types/traveler";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

interface TravelerStatusBadgeProps {
  status: TravelerStatus;
  label: string;
}

export function TravelerStatusBadge({
  status,
  label,
}: TravelerStatusBadgeProps) {
  return (
    <StatusIndicatorBadge family="traveler" label={label} status={status} />
  );
}
