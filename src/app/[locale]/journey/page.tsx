import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveJourneyPricing } from "@/lib/pricing/journey-pricing.server";
import { journeyPricingKey } from "@/lib/pricing/journey-pricing-context";
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

/** Match URLSearchParams.get when Next.js represents repeated keys as arrays. */
function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function JourneyPage(props: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ tripRequestId?: string | string[]; travelType?: string | string[]; draftId?: string | string[] }>;
}) {
  const tripperSlug = await readAttributionSlug();
  const tripperState = await resolveTripperState(tripperSlug);
  // Only forward the raw slug when it actually resolved to a live tripper —
  // a signature-valid-but-dead (deleted/deactivated) slug must never reach
  // the client/API payload, regardless of whether downstream layers
  // re-validate it (review finding #3, defense in depth).
  const validatedTripperSlug =
    tripperState.status === "ok" ? tripperSlug ?? undefined : undefined;
  const search = await props.searchParams;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null;
  const type = firstSearchValue(search?.travelType) ?? "couple";
  const tripRequestId = firstSearchValue(search?.tripRequestId)?.trim() || undefined;
  const pricing = await resolveJourneyPricing({
    currentOverrides: tripperState.status === "ok" ? tripperState.context.priceOverrides : null,
    tripRequestId,
    type,
    userId: user?.id,
  });
  if (!pricing) notFound();
  return (
    <JourneyPageClient
      params={props.params}
      pricing={{ ...pricing, binding: journeyPricingKey(email, tripRequestId, type) }}
      tripperSlug={validatedTripperSlug}
      tripperState={tripperState}
    />
  );
}
