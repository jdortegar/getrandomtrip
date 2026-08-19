import {
  readAttributionSlug,
  readLastSeenTripperSlug,
  resolveLiveAttribution,
} from "@/lib/tripper/attribution-server";
import type { TripperAttributionDict } from "@/lib/types/dictionary";
import { AttributionModeBannerToggle } from "@/components/tripper/AttributionModeBannerToggle";

interface AttributionModeBannerProps {
  copy: TripperAttributionDict;
}

/**
 * Persistent, reversible pricing-mode banner (design ADR-9, spec "Pricing-
 * Mode Banner and Toggle"). Server component: reads the `grt_tripper` cookie
 * and re-validates the tripper's liveness the same way every other
 * price-affecting read site does (spec "Read-Time Liveness Re-Validation")
 * before rendering anything — a deactivated/deleted tripper's stale cookie
 * renders no banner at all, same as "no attribution".
 *
 * Falls back to the longer-lived `grt_tripper_last_seen` cookie (review
 * finding #4) when there is no LIVE `grt_tripper` cookie — this is what lets
 * a visitor who toggled to RandomTrip mode (which clears the live cookie
 * outright) still see a "switch back to {name}" control on a later render,
 * instead of the banner disappearing with no way back short of re-clicking
 * the original referral link.
 *
 * Renders nothing when neither signal resolves to a live tripper — a
 * visitor who never carried either cookie has nothing to toggle.
 */
export async function AttributionModeBanner({ copy }: AttributionModeBannerProps) {
  const liveSlug = await readAttributionSlug();
  if (liveSlug) {
    const liveContext = await resolveLiveAttribution(liveSlug);
    if (liveContext) {
      return (
        <AttributionModeBannerToggle
          copy={copy}
          initialMode="tripper"
          tripperName={liveContext.name}
          tripperSlug={liveSlug}
        />
      );
    }
  }

  const lastSeenSlug = await readLastSeenTripperSlug();
  if (lastSeenSlug) {
    const lastSeenContext = await resolveLiveAttribution(lastSeenSlug);
    if (lastSeenContext) {
      return (
        <AttributionModeBannerToggle
          copy={copy}
          initialMode="randomtrip"
          tripperName={lastSeenContext.name}
          tripperSlug={lastSeenSlug}
        />
      );
    }
  }

  return null;
}
