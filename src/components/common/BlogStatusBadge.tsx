import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";

interface BlogStatusBadgeProps {
  label: string;
  status: string;
}

export function BlogStatusBadge({ label, status }: BlogStatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();
  return (
    <StatusIndicatorBadge
      family="blog"
      label={label}
      status={normalizedStatus}
    />
  );
}
