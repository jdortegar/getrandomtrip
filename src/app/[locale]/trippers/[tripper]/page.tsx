import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { TRIPPERS } from '@/content/trippers';
import type { BlogPost } from '@/lib/data/shared/blog-types';
import {
  getTripperBySlug,
  getTripperFeaturedTrips,
  getTripperPackagesByTypeAndLevel,
  getTripperPublishedBlogs,
} from '@/lib/db/tripper-queries';
import TripperHero from '@/components/tripper/TripperHero';
import TripperPlanner from '@/components/tripper/TripperPlanner';
import TripperInspirationGallery from '@/components/tripper/TripperInspirationGallery';
import Blog from '@/components/Blog';
import nextDynamic from 'next/dynamic';
const TripperVisitedMap = nextDynamic(
  () => import('@/components/tripper/TripperVisitedMap'),
  {
    loading: () => <div className="h-72 rounded-xl bg-gray-100" />,
    ssr: false,
  },
);
import Testimonials from '@/components/Testimonials';
import { getAllTestimonialsForTripper } from '@/lib/helpers/Tripper';
import HomeInfo from '@/components/HomeInfo';
import {
  TRIPPER_TRAVELER_TYPES_ANCHOR_ID,
  TripperTravelerTypesSection,
} from '@/components/tripper/TripperTravelerTypesSection';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

// 👇 Modal de video (client component)
import TripperIntroVideoGate from '@/components/tripper/TripperIntroVideoGate';

// Fallback blog posts when tripper has no published posts
const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    category: 'Viajes',
    href: '/blog',
    image: '/images/fallbacks/tripper-avatar.jpg',
    title: 'Rutas secretas que no aparecen en las guías',
  },
  {
    category: 'Inspiración',
    href: '/blog',
    image: '/images/fallbacks/tripper-avatar.jpg',
    title: 'Cómo planear tu próxima aventura sin estrés',
  },
  {
    category: 'Tips',
    href: '/blog',
    image: '/images/fallbacks/tripper-avatar.jpg',
    title: 'Lo que aprendí viajando por Latinoamérica',
  },
];

// Always fetch fresh data so carousel shows only types that have packages
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  // For now, we'll use the static TRIPPERS list
  // In the future, this could be replaced with a database query
  return TRIPPERS.map((t) => ({ tripper: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { tripper: string };
}): Promise<Metadata> {
  const dbTripper = await getTripperBySlug(params.tripper);

  if (!dbTripper) return { title: 'Randomtrip' };

  const heroImage = dbTripper.avatarUrl || '/images/fallback-profile.jpg';

  return {
    title: `${dbTripper.name} | Randomtrip`,
    openGraph: {
      title: `${dbTripper.name} | Randomtrip`,
      images: [{ url: heroImage, width: 1200, height: 630 }],
    },
  };
}

export default async function Page({
  params,
}: {
  params: { locale?: string; tripper: string };
}) {
  // Guard si viene vacío o 'undefined'
  if (!params?.tripper || params.tripper === 'undefined') {
    redirect('/trippers');
  }

  const locale = hasLocale(params.locale) ? params.locale : 'es';
  const dict = await getDictionary(locale);
  const homeInfoContent = {
    ...dict.home.homeInfo,
    ctaScrollTarget: `#${TRIPPER_TRAVELER_TYPES_ANCHOR_ID}`,
  };

  // Fetch from database
  const tripperData = await getTripperBySlug(params.tripper);
  const featuredTrips = await getTripperFeaturedTrips(params.tripper, 3);

  // Must have database tripper data
  if (!tripperData) return notFound();

  const tripperPackagesByType = await getTripperPackagesByTypeAndLevel(
    tripperData.id,
  );
  // availableTypesFromPackages = distinct types from this tripper's packages (from getTripperBySlug)
  const availableTypesFromPackages = tripperData.availableTypes ?? [];

  // Fetch published blog posts for this tripper
  const publishedBlogs = await getTripperPublishedBlogs(tripperData.id, 6);
  const posts: BlogPost[] =
    publishedBlogs.length > 0 ? publishedBlogs : MOCK_BLOG_POSTS;

  return (
    <main className="bg-white text-slate-900">
      <TripperHero tripper={tripperData} />


      {tripperData && tripperData.tripperSlug && (
        <TripperPlanner
          tripperData={{
            id: tripperData.id,
            name: tripperData.name,
            slug: tripperData.tripperSlug,
            commission: tripperData.commission || 0,
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
        <TripperInspirationGallery trips={featuredTrips} tripperName={tripperData.name} />
      )}
      <HomeInfo content={homeInfoContent} />
      <TripperTravelerTypesSection
        availableTypes={availableTypesFromPackages}
        tripperName={tripperData.name}
        tripperSlug={tripperData.tripperSlug}
        hideOverflow={false}
      />

      {/* Blog / inspiración */}
      {posts.length > 0 && (
        <Blog
          id="tripper-blog"
          posts={posts}
          subtitle="Notas, guías y momentos que inspiran de este tripper."
          title={`Inspiración de ${tripperData.name}`}
          viewAll={{
            href: `/blog?tripperId=${tripperData.id}&tripper=${encodeURIComponent(tripperData.name)}`,
            subtitle: 'Explora más contenido',
            title: 'Ver Todo',
          }}
        />
      )}
      <Testimonials
        testimonials={getAllTestimonialsForTripper(tripperData)}
        content={{ title: `Lo que dicen sobre ${tripperData.name}` }}
      />
      
    </main>
  );
}
