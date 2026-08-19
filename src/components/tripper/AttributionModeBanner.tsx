import {
  readAttributionSlug,
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
 * Renders nothing when there is no live attribution to surface — a visitor
 * who never carried a `grt_tripper` cookie has nothing to toggle.
 */
export async function AttributionModeBanner({ copy }: AttributionModeBannerProps) {
  const slug = await readAttributionSlug();
  if (!slug) return null;

  const context = await resolveLiveAttribution(slug);
  if (!context) return null;

  return (
    <AttributionModeBannerToggle
      copy={copy}
      tripperName={context.name}
      tripperSlug={slug}
    />
  );
}
