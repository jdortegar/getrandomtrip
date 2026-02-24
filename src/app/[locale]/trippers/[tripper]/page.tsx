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
  params: { tripper: string };
}) {
  // Guard si viene vacío o 'undefined'
  if (!params?.tripper || params.tripper === 'undefined') {
    redirect('/trippers');
  }

  // Fetch from database
  const dbTripper = await getTripperBySlug(params.tripper);
  const featuredTrips = await getTripperFeaturedTrips(params.tripper, 3);

  // Must have database tripper data
  if (!dbTripper) return notFound();

  const tripperPackagesByType = await getTripperPackagesByTypeAndLevel(
    dbTripper.id,
  );
  // availableTypesFromPackages = distinct types from this tripper's packages (from getTripperBySlug)
  const availableTypesFromPackages = dbTripper.availableTypes ?? [];

  // Fetch published blog posts for this tripper
  const publishedBlogs = await getTripperPublishedBlogs(dbTripper.id, 6);

  // Create tripper object from database data; use mock posts when none published
  const posts: BlogPost[] =
    publishedBlogs.length > 0 ? publishedBlogs : MOCK_BLOG_POSTS;

  const t = {
    name: dbTripper.name,
    slug: dbTripper.tripperSlug || params.tripper,
    avatar: dbTripper.avatarUrl || '/images/fallback-profile.jpg',
    heroImage: dbTripper.avatarUrl || '/images/fallback-profile.jpg',
    interests: dbTripper.interests || [],
    posts,
    bio: dbTripper.bio || '',
    location: dbTripper.location || '',
    agency: 'Randomtrip', // Default agency name
    visitedPlaces: [], // TODO: Add visitedPlaces field to database schema if needed
  };

  return (
    <main className="bg-white text-slate-900">
      {/* 🔔 Modal de intro. 
          Se muestra si el usuario entra directo (referrer externo) y no marcó "no volver a mostrar".
          - Se puede forzar con ?forcevideo=1
          - Se puede bloquear con ?novideo=1 (lo maneja el propio componente)
      */}
      {/* <TripperIntroVideoGate
        youtubeId="1d4OiltwQYs"
        storageKey={storageKey}
        forceShow={!!forceVideo}
      /> */}
      {/* Hero */}
      <TripperHero t={t} dbTripper={dbTripper} />

      {/* Planner: with DB data */}
      {dbTripper && dbTripper.tripperSlug && (
        <TripperPlanner
          tripperData={{
            id: dbTripper.id,
            name: dbTripper.name,
            slug: dbTripper.tripperSlug,
            commission: dbTripper.commission || 0,
            availableTypes: dbTripper.availableTypes as string[],
            destinations: dbTripper.destinations?.length
              ? dbTripper.destinations
              : undefined,
            interests: dbTripper.interests?.length
              ? dbTripper.interests
              : undefined,
          }}
          tripperPackagesByType={tripperPackagesByType}
        />
      )}
      {/* Featured Trips Gallery */}
      {featuredTrips.length > 0 && (
        <TripperInspirationGallery trips={featuredTrips} tripperName={t.name} />
      )}
      <HomeInfo ctaScrollTarget={`#${TRIPPER_TRAVELER_TYPES_ANCHOR_ID}`} />
      <TripperTravelerTypesSection
        availableTypes={availableTypesFromPackages}
        tripperName={dbTripper.name}
        tripperSlug={dbTripper.tripperSlug}
      />

      {/* Blog / inspiración */}
      {t.posts && t.posts.length > 0 && (
        <Blog
          id="tripper-blog"
          posts={t.posts}
          subtitle="Notas, guías y momentos que inspiran de este tripper."
          title={`Inspiración de ${t.name}`}
          viewAll={{
            href: `/blog?tripperId=${dbTripper.id}&tripper=${t.name}`,
            subtitle: 'Explora más contenido',
            title: 'Ver Todo',
          }}
        />
      )}
      {/* Mapa (CSR) */}
      {/* <TripperVisitedMap places={t.visitedPlaces || []} /> */}
      {/* Opiniones */}
      <Testimonials
        testimonials={getAllTestimonialsForTripper(t)}
        title={`Lo que dicen sobre ${t.name}`}
      />
      {/* JSON-LD SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: t.name,
            jobTitle: 'Travel Advisor',
            image: t.heroImage,
            worksFor: t.agency,
            homeLocation: t.location || undefined,
          }),
        }}
      />
    </main>
  );
}
