"use client";

import { useEffect, useState } from "react";
import type { NotificationAudience } from "@/components/app/dashboard/config/dashboardNavTypes";

interface DashboardUnreadDotProps {
  audience: NotificationAudience;
  variant?: "absolute" | "inline";
}

export function DashboardUnreadDot({
  audience,
  variant = "absolute",
}: DashboardUnreadDotProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`/api/notifications/unread-count?audience=${audience}`)
      .then((res) => {
        if (!res.ok) throw new Error("non-2xx");
        return res.json() as Promise<{ count: number }>;
      })
      .then(({ count: nextCount }) => setCount(nextCount))
      .catch(() => setCount(0));
  }, [audience]);

  if (count === 0) return null;

  if (variant === "inline") {
    return (
      <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" />
    );
  }

  return (
    <span className="absolute -right-0.25 -top-0.25 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white" />
  );
}
