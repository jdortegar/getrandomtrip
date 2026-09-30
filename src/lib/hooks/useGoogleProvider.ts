"use client";

import { useEffect, useMemo, useState } from "react";
import { getProviders } from "next-auth/react";

interface ProviderResult {
  available: boolean;
  request: object;
}

/** The auth endpoint, not a public environment flag, decides availability. */
export function useGoogleProvider(active = true): boolean {
  const request = useMemo(() => ({ active }), [active]);
  const [result, setResult] = useState<ProviderResult | null>(null);

  useEffect(() => {
    if (!request.active) return;
    let cancelled = false;
    void getProviders()
      .then((providers) => {
        if (!cancelled) {
          setResult({ available: providers?.google?.id === "google", request });
        }
      })
      .catch(() => {
        if (!cancelled) setResult({ available: false, request });
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  // An old result cannot reveal Google while a newly opened modal revalidates.
  return active && result?.request === request && result.available;
}
