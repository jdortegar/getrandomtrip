import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { readAttributionSlug } from "@/lib/tripper/attribution-server";
import { getTripperJourneyContext } from "@/lib/db/tripper-queries";
import type { TripperContextState } from "@/types/tripper";
import JourneyPageClient from "./JourneyPageClient";

export { getAccordionForStep } from "@/lib/helpers/journey";

/**
 * Resolves the journey page's tripper state from the (already
 * liveness-re-validated) attribution slug — `not_found`/`inactive` map to
 * the same "none"/"unavailable" split the old client-side fetch to
 * `/api/trippers/[slug]/journey-context` used, but sourced from the
 * `grt_tripper` cookie server-side instead of a client-read `?tripper=`
 * query param (retired — the cookie/proxy now handles attribution
 * end-to-end, design "Data Flow").
 */
async function resolveTripperState(
  slug: string | null,
): Promise<TripperContextState> {
  if (!slug) return { status: "none" };
  try {
    const result = await getTripperJourneyContext(slug);
    if (result.status === "ok") return { status: "ok", context: result.context };
    if (result.status === "inactive") {
      return { status: "unavailable", name: result.name };
    }
    return { status: "none" };
  } catch (error) {
    // `getTripperJourneyContext` re-throws unexpected DB errors instead of
    // swallowing them into `{ status: "not_found" }` (review finding #7 —
    // that swallowing used to get memoized by `cache()` for the rest of
    // the request). Caught here, not inside the cached function, so the
    // failure is never memoized — a later call in the same request (e.g.
    // from `AttributionModeBanner`) can still succeed even if this didn't.
    console.error("resolveTripperState: getTripperJourneyContext threw", error);
    return { status: "none" };
  }
}

export async function generateMetadata(props: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const locale = params?.locale;
  const dict = await getDictionary(hasLocale(locale) ? locale! : "es");
  const meta = dict.journey.meta;
  return {
    description: meta.description,
    robots: { follow: false, index: false },
    title: meta.title,
  };
}

export default async function JourneyPage(props: {
  params?: Promise<{ locale?: string }>;
}) {
  const tripperSlug = await readAttributionSlug();
  const tripperState = await resolveTripperState(tripperSlug);
  // Only forward the raw slug when it actually resolved to a live tripper —
  // a signature-valid-but-dead (deleted/deactivated) slug must never reach
  // the client/API payload, regardless of whether downstream layers
  // re-validate it (review finding #3, defense in depth).
  const validatedTripperSlug =
    tripperState.status === "ok" ? tripperSlug ?? undefined : undefined;
  return (
    <JourneyPageClient
      params={props.params}
      tripperSlug={validatedTripperSlug}
      tripperState={tripperState}
    />
  );
}
