"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TableLoadingOverlayProps {
  children: ReactNode;
  /** Merged onto the single rendered div — pass the panel's existing classes here. */
  className?: string;
  /** True while ANY fetch is in flight, including the first one. */
  isLoading: boolean;
}

/**
 * Dims and locks a table panel during a refetch. This IS the panel — the
 * caller passes its existing panel classes via `className`, so no extra DOM
 * node is introduced. The initial-load spinner remains the caller's job:
 * `if (isLoading && !hasLoadedOnce) return <LoadingSpinner />`.
 */
export function TableLoadingOverlay({
  children,
  className,
  isLoading,
}: TableLoadingOverlayProps) {
  return (
    <div
      aria-busy={isLoading}
      className={cn(
        "transition-opacity",
        className,
        isLoading && "pointer-events-none opacity-50",
      )}
    >
      {children}
    </div>
  );
}
