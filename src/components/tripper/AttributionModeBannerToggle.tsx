"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TripperAttributionDict } from "@/lib/types/dictionary";

type DisplayMode = "tripper" | "randomtrip";

interface AttributionModeBannerToggleProps {
  copy: TripperAttributionDict;
  /**
   * Server-resolved starting mode (review finding #4): `"tripper"` when
   * there's a LIVE `grt_tripper` cookie, `"randomtrip"` when only the
   * longer-lived `grt_tripper_last_seen` cookie resolved (the visitor
   * previously toggled off, but can still switch back to `tripperName`).
   */
  initialMode: DisplayMode;
  tripperName: string;
  tripperSlug: string;
}

/**
 * Client half of `AttributionModeBanner` (design ADR-9) — the server half
 * resolves the initial slug/name/mode from the `grt_tripper` /
 * `grt_tripper_last_seen` cookies; this piece owns the toggle interaction.
 * The toggle only ever calls `POST /api/attribution/mode` — it never
 * touches `referredByTripperId` (spec "Banner toggle changes cookie only").
 * Copy is deliberately framed around which experiences are shown, not
 * around pricing.
 */
export function AttributionModeBannerToggle({
  copy,
  initialMode,
  tripperName,
  tripperSlug,
}: AttributionModeBannerToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<DisplayMode>(initialMode);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    const nextMode: DisplayMode = mode === "tripper" ? "randomtrip" : "tripper";
    setIsPending(true);
    try {
      const response = await fetch("/api/attribution/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          nextMode === "tripper"
            ? { mode: "tripper", slug: tripperSlug }
            : { mode: "randomtrip" },
        ),
      });
      if (response.ok) {
        setMode(nextMode);
        // Already-rendered Server Component output (e.g. by-type page price
        // overrides baked into the initial HTML) does not update on its own
        // just because the cookie changed — force a re-render of the current
        // route's Server Components so prices reflect the new attribution
        // state immediately (review finding #5).
        router.refresh();
      }
    } finally {
      setIsPending(false);
    }
  };

  // `?catalog=randomtrip` (design ADR-8) is the by-type page's own,
  // per-request opt-out into base RandomTrip pricing for a single
  // non-offered type — read here via `useSearchParams()` (not prop-drilled
  // from the layout, which never receives `searchParams` for pages further
  // down the tree) so the banner's message can't contradict the page
  // content rendered directly below it (review finding #6). This never
  // changes the actual `grt_tripper` cookie — the toggle button is hidden
  // entirely on a `catalog=randomtrip` URL instead of offering a
  // cookie-level toggle whose label/effect wouldn't match this page-local,
  // per-request opt-out (e.g. the real cookie can still be in "tripper"
  // mode site-wide while this one type shows base pricing).
  const catalogOptOut = searchParams?.get("catalog") === "randomtrip";

  if (catalogOptOut) {
    return (
      <div className="w-full bg-primary text-white">
        <div className="rt-container flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-center text-sm">
          <span>{copy.bannerRandomtripModeMessage}</span>
        </div>
      </div>
    );
  }

  const message =
    mode === "tripper"
      ? copy.bannerTripperModeMessage.replace("{name}", tripperName)
      : copy.bannerRandomtripModeMessage;
  const actionLabel =
    mode === "tripper"
      ? copy.bannerSwitchToRandomtrip
      : copy.bannerSwitchToTripper.replace("{name}", tripperName);

  return (
    <div className="w-full bg-primary text-white">
      <div className="rt-container flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-center text-sm">
        <span>{message}</span>
        <button
          className="font-semibold text-secondary underline underline-offset-2 hover:text-secondary/80 disabled:opacity-50"
          disabled={isPending}
          onClick={handleToggle}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
