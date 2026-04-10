import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  selected?: boolean;
}

export function Badge({ children, className, selected = false }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
        selected
          ? "border-gray-800 bg-gray-800 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
