"use client";

import { DashboardUnreadDot } from "@/components/app/dashboard/shell/DashboardUnreadDot";

interface TripperUnreadDotProps {
  variant?: "absolute" | "inline";
}

export function TripperUnreadDot({
  variant = "absolute",
}: TripperUnreadDotProps) {
  return <DashboardUnreadDot audience="TRIPPER" variant={variant} />;
}
