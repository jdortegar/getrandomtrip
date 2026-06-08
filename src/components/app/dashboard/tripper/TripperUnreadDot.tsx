"use client";

import { useEffect, useState } from "react";

interface TripperUnreadDotProps {
  variant?: "absolute" | "inline";
}

export function TripperUnreadDot({
  variant = "absolute",
}: TripperUnreadDotProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications/unread-count")
      .then((res) => {
        if (!res.ok) throw new Error("non-2xx");
        return res.json() as Promise<{ count: number }>;
      })
      .then(({ count }) => setCount(count))
      .catch(() => setCount(0));
  }, []);

  if (count === 0) return null;

  if (variant === "inline") {
    return (
      <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
    );
  }

  return (
    <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.25 -right-0.25 ring-1 ring-white" />
  );
}
