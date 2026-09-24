"use client";

import { useState } from "react";

/**
 * Latches true the first time `isLoading` settles to false, and never flips
 * back to false afterward — including when `isLoading` becomes true again
 * for a refetch, or when the settle happened via an error path.
 * Already-settled mounts return true immediately, including during SSR.
 */
export function useHasLoadedOnce(isLoading: boolean): boolean {
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!isLoading);

  if (!hasLoadedOnce && !isLoading) {
    setHasLoadedOnce(true);
  }

  return hasLoadedOnce;
}
