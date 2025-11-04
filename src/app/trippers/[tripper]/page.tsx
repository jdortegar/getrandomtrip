import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { TRIPPERS } from '@/content/trippers';
import {
  getTripperBySlug,
  getTripperFeaturedTrips,
  getTripperPackagesByTypeAndLevel,
  getTripperPublishedBlogs,
} from '@/lib/db/tripper-queries';
import { getTripperAvailableTypesAndLevels } from '@/lib/data/tripper-trips';
import TripperHero from '@/components/tripper/TripperHero';
import TripperPlanner from '@/components/tripper/TripperPlanner';
import TripperInspirationGallery from '@/components/tripper/TripperInspirationGallery';
import Blog from '@/components/Blog';
import Section from '@/components/layout/Section';
import dynamic from 'next/dynamic';
const TripperVisitedMap = dynamic(
  () => import('@/components/tripper/TripperVisitedMap'),
  {
    ssr: false,
    loading: () => <div className="h-72 rounded-xl bg-gray-100" />,
  },
);
import Testimonials from '@/components/Testimonials';
import { getAllTestimonialsForTripper } from '@/lib/helpers/Tripper';
import HomeInfo from '@/components/HomeInfo';
import { ExplorationSection } from '@/components/landing/exploration';

// 👇 Modal de video (client component)
import TripperIntroVideoGate from '@/components/tripper/TripperIntroVideoGate';

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

  // Fetch tripper packages for filtering
  const tripperPackages = dbTripper
    ? await getTripperAvailableTypesAndLevels(dbTripper.id)
    : [];

  // Fetch tripper packages organized by type and level
  const tripperPackagesByType = dbTripper
    ? await getTripperPackagesByTypeAndLevel(dbTripper.id)
    : {};

  // Must have database tripper data
  if (!dbTripper) return notFound();

  // Fetch published blog posts for this tripper
  const publishedBlogs = await getTripperPublishedBlogs(dbTripper.id, 6);

  // Create tripper object from database data
  const t = {
    name: dbTripper.name,
    slug: dbTripper.tripperSlug || params.tripper,
    avatar: dbTripper.avatarUrl || '/images/fallback-profile.jpg',
    heroImage: dbTripper.avatarUrl || '/images/fallback-profile.jpg',
    interests: dbTripper.interests || [],
    posts: publishedBlogs,
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
      <HomeInfo />
      {/* Featured Trips Gallery */}
      {featuredTrips.length > 0 && (
        <TripperInspirationGallery trips={featuredTrips} tripperName={t.name} />
      )}

      {/* Planner: with DB data */}
      {dbTripper && dbTripper.tripperSlug && (
        <TripperPlanner
          tripperData={{
            id: dbTripper.id,
            name: dbTripper.name,
            slug: dbTripper.tripperSlug,
            commission: dbTripper.commission || 0,
            availableTypes: dbTripper.availableTypes as string[],
          }}
          tripperPackages={tripperPackages}
          tripperPackagesByType={tripperPackagesByType}
        />
      )}
      {/* Blog / inspiración */}
      {t.posts && t.posts.length > 0 && (
        <Blog
          content={{
            title: `Inspiración de ${t.name}`,
            subtitle: 'Notas, guías y momentos que inspiran de este tripper.',
            posts: t.posts,
            viewAll: {
              title: 'Ver Todo',
              subtitle: 'Explora más contenido',
              href: `/blog?tripper=${t.slug}`,
            },
          }}
          id="tripper-blog"
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
