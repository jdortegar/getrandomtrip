"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatLocalApprox } from "@/lib/currency/format";
import type { LocalCurrencyInfo } from "@/types/core";

interface DisplayCurrencyContextValue {
  /** Detected local currency; null means USD only (USD visitor, no geo, no rates). */
  local: LocalCurrencyInfo | null;
  /** "≈ local" reference line for a USD price, or null when there is no local currency. */
  formatApprox: (usd: number | string) => string | null;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue>({
  local: null,
  formatApprox: () => null,
});

/** Loads the visitor's display-only local currency; charges are always USD. */
export function CurrencyProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [local, setLocal] = useState<LocalCurrencyInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Forward a dev-only ?country=XX override; the API ignores it in production.
    const country = new URLSearchParams(window.location.search).get("country");
    fetch(country ? `/api/currency?country=${encodeURIComponent(country)}` : "/api/currency")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { local: LocalCurrencyInfo | null } | null) => {
        if (!cancelled) setLocal(data?.local ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<DisplayCurrencyContextValue>(
    () => ({
      local,
      formatApprox: (usd) => (local ? formatLocalApprox(usd, local, locale) : null),
    }),
    [local, locale],
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  return useContext(DisplayCurrencyContext);
}
