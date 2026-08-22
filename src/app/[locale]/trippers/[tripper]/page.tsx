import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getAllTrippers,
  getTripperBySlug,
  getTripperExperiencesByTypeAndLevel,
  getTripperFeaturedTrips,
  getTripperPublishedBlogs,
} from "@/lib/db/tripper-queries";
import TripperHero from "@/components/tripper/TripperHero";
import { TripperUnavailableNotice } from "@/components/tripper/TripperUnavailableNotice";
import { DashboardNavbarPrimaryLayout } from "@/components/app/dashboard/DashboardNavbarPrimaryLayout";
import TripperPlanner from "@/components/tripper/TripperPlanner";
import TripperInspirationGallery from "@/components/tripper/TripperInspirationGallery";
import Blog from "@/components/Blog";
import Testimonials from "@/components/Testimonials/Testimonials";
import { getAllTestimonialsForTripper } from "@/lib/helpers/Tripper";
import HomeInfo from "@/components/HomeInfo";
import {
  TRIPPER_TRAVELER_TYPES_ANCHOR_ID,
  TripperTravelerTypesSection,
} from "@/components/tripper/TripperTravelerTypesSection";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPersonSchema } from "@/lib/seo/schemas";

// 👇 Modal de video (client component)
import TripperIntroVideoGate from "@/components/tripper/TripperIntroVideoGate";

// Always fetch fresh data so carousel shows only types that have packages
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const trippers = await getAllTrippers();
  return trippers.map((t) => ({ tripper: t.tripperSlug }));
}

export async function generateMetadata(props: {
  params: Promise<{ tripper: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const result = await getTripperBySlug(params.tripper);

  if (result.status !== "ok") return { title: "Randomtrip" };

  const { tripper } = result;
  const ogImage = tripper.heroImage ?? tripper.avatarUrl ?? "/images/opengraph.png";

  return {
    title: `${tripper.name} | Randomtrip`,
    openGraph: {
      images: [{ url: ogImage, width: 1200, height: 630 }],
      title: `${tripper.name} | Randomtrip`,
    },
  };
}

export default async function Page(props: {
  params: Promise<{ locale?: string; tripper: string }>;
}) {
  const params = await props.params;
  // Guard si viene vacío o 'undefined'
  if (!params?.tripper || params.tripper === "undefined") {
    redirect("/trippers");
  }

  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);
  const homeInfoContent = {
    ...dict.home.homeInfo,
    ctaScrollTarget: `#${TRIPPER_TRAVELER_TYPES_ANCHOR_ID}`,
  };

  // Fetch from database — three-way discriminated result
  const tripperResult = await getTripperBySlug(params.tripper);

  if (tripperResult.status === "not_found") return notFound();

  if (tripperResult.status === "inactive") {
    return (
      <DashboardNavbarPrimaryLayout>
        <TripperUnavailableNotice
          copy={dict.trippers.unavailable}
          ctaHref={pathForLocale(locale, "/trippers")}
          tripperName={tripperResult.name}
        />
      </DashboardNavbarPrimaryLayout>
    );
  }

  const tripperData = tripperResult.tripper;
  const [featuredTrips, tripperPackagesByType] = await Promise.all([
    getTripperFeaturedTrips(params.tripper, 3),
    getTripperExperiencesByTypeAndLevel(tripperData.id),
  ]);
  // availableTypesFromPackages = distinct types from this tripper's packages (from getTripperBySlug)
  const availableTypesFromPackages = tripperData.availableTypes ?? [];

  // Fetch published blog posts for this tripper
  const rawPublishedBlogs = await getTripperPublishedBlogs(tripperData.id, 6, locale);
  const publishedBlogs = rawPublishedBlogs.map((p) => ({
    ...p,
    href: pathForLocale(locale, p.href),
  }));

  return (
    <main className="bg-white text-slate-900">
      <JsonLd
        schema={buildPersonSchema({
          avatarUrl: tripperData.avatarUrl,
          bio: tripperData.bio,
          heroImage: tripperData.heroImage,
          name: tripperData.name,
          slug: tripperData.tripperSlug,
        })}
      />
      <TripperHero tripper={tripperData} />

      {tripperData && tripperData.tripperSlug && (
        <TripperPlanner
          tripperData={{
            id: tripperData.id,
            name: tripperData.name,
            slug: tripperData.tripperSlug,
            commission: tripperData.commission,
            availableTypes: tripperData.availableTypes as string[],
            destinations: tripperData.destinations?.length
              ? tripperData.destinations
              : undefined,
            interests: tripperData.interests?.length
              ? tripperData.interests
              : undefined,
          }}
          tripperPackagesByType={tripperPackagesByType}
        />
      )}

      {/* Featured Trips Gallery */}
      {featuredTrips.length > 0 && (
        <TripperInspirationGallery
          trips={featuredTrips}
          tripperName={tripperData.name}
        />
      )}
      <HomeInfo content={homeInfoContent} />
      <TripperTravelerTypesSection
        availableTypes={availableTypesFromPackages}
        avatarUrl={tripperData.avatarUrl}
        copy={dict.trippers.travelerTypesSection}
        tripperName={tripperData.name}
        tripperSlug={tripperData.tripperSlug}
      />

      {/* Blog / inspiración — only render when tripper has published posts */}
      {publishedBlogs.length > 0 && (
        <Blog
          id="tripper-blog"
          posts={publishedBlogs}
          subtitle="Notas, guías y momentos que inspiran de este tripper."
          title={`Inspiración de ${tripperData.name}`}
          viewAll={{
            href: pathForLocale(locale, `/blog?tripperId=${tripperData.id}&tripper=${encodeURIComponent(tripperData.name)}`),
            subtitle: "Explora más contenido",
            title: "Ver Todo",
          }}
        />
      )}
      <Testimonials
        testimonials={await getAllTestimonialsForTripper(tripperData)}
        title={`Lo que dicen sobre ${tripperData.name}`}
        subtitle={`Lo que dicen sobre ${tripperData.name}`}
        eyebrow={`Lo que dicen sobre ${tripperData.name}`}
        viewFullReviewLabel={`Lo que dicen sobre ${tripperData.name}`}
      />
    </main>
  );
}
