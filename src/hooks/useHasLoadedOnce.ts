"use client";

import { useEffect, useState } from "react";

/**
 * Latches true the first time `isLoading` settles to false, and never flips
 * back to false afterward — including when `isLoading` becomes true again
 * for a refetch, or when the settle happened via an error path.
 */
export function useHasLoadedOnce(isLoading: boolean): boolean {
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (!isLoading) setHasLoadedOnce(true);
  }, [isLoading]);

  return hasLoadedOnce;
}
