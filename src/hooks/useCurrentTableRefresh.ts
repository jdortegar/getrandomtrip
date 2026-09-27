"use client";

import { useCallback, useEffect, useRef } from "react";

/** Mutation completions refresh the latest committed query, not their old closure. */
export function useCurrentTableRefresh<Args extends unknown[]>(
  refresh: (...args: Args) => Promise<unknown> | void,
) {
  const latest = useRef<typeof refresh | null>(refresh);
  useEffect(() => {
    latest.current = refresh;
    return () => {
      latest.current = null;
    };
  }, [refresh]);

  return useCallback(async (...args: Args) => {
    await latest.current?.(...args);
  }, []);
}
