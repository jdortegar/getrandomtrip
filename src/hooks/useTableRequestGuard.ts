"use client";

import { useCallback, useEffect, useRef } from "react";

/** Keeps query changes, retries and mutation-triggered refetches latest-only. */
export function useTableRequestGuard(queryKey: string) {
  const current = useRef({ generation: 0, key: queryKey, mounted: true });

  useEffect(() => {
    const state = current.current;
    state.key = queryKey;
    state.mounted = true;
    return () => {
      state.generation += 1;
      state.mounted = false;
    };
  }, [queryKey]);

  return useCallback(() => {
    if (!current.current.mounted || current.current.key !== queryKey) {
      return () => false;
    }
    const generation = ++current.current.generation;
    return () =>
      current.current.mounted &&
      current.current.key === queryKey &&
      current.current.generation === generation;
  }, [queryKey]);
}
