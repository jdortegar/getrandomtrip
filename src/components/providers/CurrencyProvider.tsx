"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { COOKIE_DISPLAY_CURRENCY } from "@/lib/currency/config";
import { formatLocalApprox } from "@/lib/currency/format";
import type { CurrencyDict } from "@/lib/types/dictionary";
import type { DisplayCurrencyMode, LocalCurrencyInfo } from "@/types/core";

interface DisplayCurrencyContextValue {
  /** Detected local currency; null hides the selector (USD visitor, no geo, no rates). */
  local: LocalCurrencyInfo | null;
  /** True when prices should render in the local currency. */
  isLocal: boolean;
  locale: string;
  setMode: (mode: DisplayCurrencyMode) => void;
  /**
   * Browse price: the local "≈" amount when selected, otherwise `usdLabel`
   * unchanged (each call site keeps its existing USD text).
   */
  formatPrice: (usd: number | string, usdLabel: string) => string;
  /** Secondary "≈ local" line for checkout, or null when USD is selected. */
  formatApprox: (usd: number | string) => string | null;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue>({
  local: null,
  isLocal: false,
  locale: "es",
  setMode: () => {},
  formatPrice: (_usd, usdLabel) => usdLabel,
  formatApprox: () => null,
});

function readModeCookie(): DisplayCurrencyMode {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_DISPLAY_CURRENCY}=([^;]*)`),
  );
  return match?.[1] === "LOCAL" ? "LOCAL" : "USD";
}

// Session cookie (no max-age): every new browser session starts in USD.
function writeModeCookie(mode: DisplayCurrencyMode) {
  document.cookie = `${COOKIE_DISPLAY_CURRENCY}=${mode}; path=/; sameSite=lax`;
}

export function CurrencyProvider({
  children,
  copy,
  locale,
}: {
  children: React.ReactNode;
  copy: CurrencyDict;
  locale: string;
}) {
  const [local, setLocal] = useState<LocalCurrencyInfo | null>(null);
  const [mode, setModeState] = useState<DisplayCurrencyMode>("USD");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/currency")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { local: LocalCurrencyInfo | null } | null) => {
        if (cancelled) return;
        setLocal(data?.local ?? null);
        setModeState(readModeCookie());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(
    (next: DisplayCurrencyMode) => {
      setModeState(next);
      writeModeCookie(next);
      if (next === "LOCAL" && local) {
        toast.info(copy.referenceToast.replace("{currency}", local.currency));
      }
    },
    [copy.referenceToast, local],
  );

  const value = useMemo<DisplayCurrencyContextValue>(() => {
    const isLocal = mode === "LOCAL" && local !== null;
    return {
      local,
      isLocal,
      locale,
      setMode,
      formatPrice: (usd, usdLabel) =>
        isLocal && local ? formatLocalApprox(usd, local, locale) : usdLabel,
      formatApprox: (usd) =>
        isLocal && local ? formatLocalApprox(usd, local, locale) : null,
    };
  }, [local, locale, mode, setMode]);

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  return useContext(DisplayCurrencyContext);
}
