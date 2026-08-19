import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import Paragraph from "@/components/Paragraph";
import Testimonials from "@/components/Testimonials/Testimonials";
import Blog from "@/components/Blog";
import TypePlanner from "@/components/by-type/TypePlanner";
import InspirationBanner from "@/components/InspirationBanner";
import {
  getTravelerType,
  getAllTravelerTypePaths,
  type TravelerTypeSlug,
} from "@/lib/data/traveler-types";
import { getReviewsForTripType } from "@/lib/db/tripper-queries";
import { getPlannerContentForType } from "@/lib/utils/experiencesData";
import { isTypeOffered } from "@/lib/utils/traveler-card";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import {
  readAttributionSlug,
  resolveLiveAttribution,
} from "@/lib/tripper/attribution-server";

/**
 * Generate static paths for all traveler types and their aliases.
 * Parent [locale] segment provides locale; we only provide type.
 */
export async function generateStaticParams() {
  const paths = getAllTravelerTypePaths();
  return paths.map((type) => ({ type }));
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata(props: {
  params: Promise<{ locale?: string; type: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const locale = hasLocale(params?.locale)
    ? (params.locale as Locale)
    : ("es" as Locale);
  const typeData = getTravelerType(params.type, locale);

  if (!typeData) {
    return { title: "Randomtrip" };
  }

  return {
    title: typeData.meta.pageTitle,
  };
}

/**
 * Main page component. Params include parent [locale] and this segment [type].
 */
export default async function TravelerTypePage(props: {
  params: Promise<{ locale?: string; type: string }>;
  searchParams: Promise<{ catalog?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const locale = hasLocale(params.locale)
    ? (params.locale as Locale)
    : ("es" as Locale);
  const typeData = getTravelerType(params.type, locale);

  if (!typeData) {
    notFound();
  }

  // `?catalog=randomtrip` is a per-request, reversible opt-out into base
  // RandomTrip pricing — read here by the page, not by the proxy, so it
  // never touches the `grt_tripper` cookie itself (design ADR-8).
  //
  // The attribution resolution (cookie read + possible DB call) doesn't
  // depend on, and isn't depended on by, `getDictionary`/
  // `getReviewsForTripType` — all three ran sequentially before (review
  // finding #10). Both `getDictionary` (a bundled JSON import) and
  // `getReviewsForTripType` (catches its own DB errors internally, see
  // `tripper-queries.ts`) never reject in practice, and `resolveLiveAttribution`
  // now catches its own errors too (review finding #7) — so a plain
  // `Promise.all` is correct here, not `allSettled`.
  const catalogOptOut = searchParams?.catalog === "randomtrip";
  const [tripperContext, dict, testimonials] = await Promise.all([
    catalogOptOut
      ? Promise.resolve(null)
      : readAttributionSlug().then((slug) => resolveLiveAttribution(slug)),
    getDictionary(locale),
    getReviewsForTripType(typeData.meta.slug),
  ]);
  const priceOverrides =
    tripperContext &&
    isTypeOffered(tripperContext.allowedTypes, typeData.meta.slug)
      ? tripperContext.priceOverrides
      : null;

  const { blogEyebrow, inspirationBanner } = dict.packagesByType;
  const blogHref = pathForLocale(locale, "/blog");
  const viewAll = typeData.blog.viewAll
    ? {
        ...typeData.blog.viewAll,
        href: pathForLocale(locale, typeData.blog.viewAll.href),
      }
    : undefined;

  return (
    <main className="relative">
      <Hero
        content={typeData.content.hero}
        id={`${typeData.meta.slug}-hero`}
        scrollIndicator={true}
      />
      <Paragraph
        content={typeData.content.story}
        id={`${typeData.meta.slug}-story`}
      />
      <TypePlanner
        content={getPlannerContentForType(
          typeData.meta.slug,
          locale,
          priceOverrides,
        )}
        itemsPerView={3}
        type={typeData.meta.slug as TravelerTypeSlug}
        navigateOnCardClick={true}
      />
      <Blog
        eyebrow={blogEyebrow}
        id="blog"
        posts={typeData.blog.posts.map((p) => ({ ...p, href: pathForLocale(locale, p.href) }))}
        subtitle={typeData.blog.subtitle}
        title={typeData.blog.title}
        viewAll={viewAll}
      />
      <InspirationBanner
        buttonHref={blogHref}
        buttonText={inspirationBanner.buttonText}
        eyebrow={inspirationBanner.eyebrow}
        image="/images/caravan.png"
        labelText={inspirationBanner.labelText}
        title={inspirationBanner.title}
      />
      <Testimonials testimonials={testimonials} title={typeData.testimonials.title} />
    </main>
  );
}
