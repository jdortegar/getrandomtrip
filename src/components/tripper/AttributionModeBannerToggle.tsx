"use client";

import { useState } from "react";
import type { TripperAttributionDict } from "@/lib/types/dictionary";

type DisplayMode = "tripper" | "randomtrip";

interface AttributionModeBannerToggleProps {
  copy: TripperAttributionDict;
  tripperName: string;
  tripperSlug: string;
}

/**
 * Client half of `AttributionModeBanner` (design ADR-9) — the server half
 * resolves the initial slug/name from the `grt_tripper` cookie; this piece
 * owns the toggle interaction and keeps the underlying slug in memory so the
 * visitor can switch back to the tripper's curated experiences even after
 * switching to RandomTrip's general experiences clears the cookie entirely
 * (mirrors the comment on `POST /api/attribution/mode`: "the banner keeps
 * the underlying slug client-side"). The toggle only ever calls that route —
 * it never touches `referredByTripperId` (spec "Banner toggle changes
 * cookie only"). Copy is deliberately framed around which experiences are
 * shown, not around pricing.
 */
export function AttributionModeBannerToggle({
  copy,
  tripperName,
  tripperSlug,
}: AttributionModeBannerToggleProps) {
  const [mode, setMode] = useState<DisplayMode>("tripper");
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
      if (response.ok) setMode(nextMode);
    } finally {
      setIsPending(false);
    }
  };

  const message =
    mode === "tripper"
      ? copy.bannerTripperModeMessage.replace("{name}", tripperName)
      : copy.bannerRandomtripModeMessage;
  const actionLabel =
    mode === "tripper"
      ? copy.bannerSwitchToRandomtrip
      : copy.bannerSwitchToTripper.replace("{name}", tripperName);

  return (
    <div className="w-full bg-gray-900 text-white">
      <div className="rt-container flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-center text-sm">
        <span>{message}</span>
        <button
          className="font-semibold text-light-blue underline underline-offset-2 hover:text-light-blue/80 disabled:opacity-50"
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
