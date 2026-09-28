"use client";

import { useEffect, useState } from "react";

interface SoldCountSnapshot {
  country: string;
  displayedSold: number;
  isSoldOut: boolean;
  key: string;
  totalSlots: number;
}

/** Only expose results for the current country, drop and local window. */
export function useXsedSoldCount(
  dropSlug: string | undefined,
  country: string | null,
  windowKey: string | null,
) {
  const key =
    dropSlug && country && windowKey
      ? JSON.stringify([dropSlug, country, windowKey])
      : null;
  const [snapshot, setSnapshot] = useState<SoldCountSnapshot | null>(null);

  useEffect(() => {
    if (!key || !dropSlug || !country) return;
    let stopped = false;
    let inFlight = false;
    const controller = new AbortController();

    async function poll() {
      if (stopped || inFlight) return;
      inFlight = true;
      try {
        const res = await fetch(
          `/api/xsed/drops/${encodeURIComponent(dropSlug!)}/sold-count?country=${country}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (!res.ok || stopped) return;
        const data = (await res.json()) as Partial<SoldCountSnapshot> | null;
        if (
          stopped ||
          !data ||
          data.country !== country ||
          typeof data.displayedSold !== "number" ||
          !Number.isInteger(data.displayedSold) ||
          typeof data.totalSlots !== "number" ||
          !Number.isInteger(data.totalSlots) ||
          data.displayedSold < 0 ||
          data.totalSlots < 0 ||
          data.displayedSold > data.totalSlots ||
          data.isSoldOut !== data.displayedSold >= data.totalSlots
        )
          return;
        setSnapshot({
          country: data.country,
          displayedSold: data.displayedSold,
          isSoldOut: data.isSoldOut,
          key: key!,
          totalSlots: data.totalSlots,
        });
        if (data.isSoldOut) stopped = true;
      } catch {
        // A failed request leaves the counter hidden/stale until the next retry.
      } finally {
        inFlight = false;
      }
    }

    void poll();
    const id = setInterval(() => {
      void poll();
    }, 30_000);
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(id);
    };
  }, [country, dropSlug, key]);

  return key && snapshot?.key === key ? snapshot : null;
}
