import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

interface ExperienceStatusBadgeProps {
  status: string;
  label: string;
}

export function ExperienceStatusBadge({
  status,
  label,
}: ExperienceStatusBadgeProps) {
  return (
    <StatusIndicatorBadge family="experience" label={label} status={status} />
  );
}
