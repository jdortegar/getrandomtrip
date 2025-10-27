// frontend/src/app/packages/(tripper)/[tripper]/page.tsx
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import {
  TRIPPERS,
  getTripperBySlug as getStaticTripper,
} from '@/content/trippers';
import {
  getTripperBySlug,
  getTripperFeaturedTrips,
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

export function generateStaticParams() {
  return TRIPPERS.map((t) => ({ tripper: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { tripper: string };
}): Promise<Metadata> {
  // Try DB first, fallback to static
  const dbTripper = await getTripperBySlug(params.tripper);
  const staticTripper = getStaticTripper(params.tripper);
  const t = dbTripper || staticTripper;

  if (!t) return { title: 'Randomtrip' };

  const avatar = dbTripper?.avatarUrl || staticTripper?.avatar || '';
  const heroImage = staticTripper?.heroImage || avatar;

  return {
    title: `${t.name} | Randomtrip`,
    openGraph: {
      title: `${t.name} | Randomtrip`,
      images: [{ url: heroImage, width: 1200, height: 630 }],
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { tripper: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Guard si viene vacío o 'undefined'
  if (!params?.tripper || params.tripper === 'undefined') {
    redirect('/packages/by-type/group');
  }

  // Fetch from database
  const dbTripper = await getTripperBySlug(params.tripper);
  const featuredTrips = await getTripperFeaturedTrips(params.tripper, 3);

  // Fetch tripper packages for filtering
  const tripperPackages = dbTripper
    ? await getTripperAvailableTypesAndLevels(dbTripper.id)
    : [];

  // Fallback to static content for now
  const staticTripper = getStaticTripper(params.tripper);

  // Must have at least one data source
  if (!staticTripper && !dbTripper) return notFound();

  // Use static tripper as primary for now (contains posts, bio, etc)
  // If no static tripper, we'll still need to handle this gracefully
  const t =
    staticTripper ||
    ({
      name: dbTripper?.name || 'Tripper',
      slug: params.tripper,
      avatar: dbTripper?.avatarUrl || '/images/fallback-profile.jpg',
      interests: dbTripper?.interests || [],
    } as any);

  // QA: permitir forzar el video con ?forcevideo=1
  const forceVideo =
    (typeof searchParams?.forcevideo === 'string' &&
      searchParams?.forcevideo === '1') ||
    (Array.isArray(searchParams?.forcevideo) &&
      searchParams?.forcevideo?.[0] === '1');

  // Clave específica por tripper para que no se mezcle el "no volver a mostrar"
  const storageKey = `rt_tripper_intro_seen:${t.slug}`;

  return (
    <main className="bg-white text-slate-900">
      {/* 🔔 Modal de intro. 
          Se muestra si el usuario entra directo (referrer externo) y no marcó “no volver a mostrar”.
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
      <TripperPlanner
        staticTripper={t}
        tripperData={
          dbTripper && dbTripper.tripperSlug
            ? {
                id: dbTripper.id,
                name: dbTripper.name,
                slug: dbTripper.tripperSlug,
                commission: dbTripper.commission || 0,
                availableTypes: dbTripper.availableTypes as any[],
              }
            : undefined
        }
        tripperPackages={tripperPackages}
      />

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
            image: t.heroImage || t.avatar,
            worksFor: t.agency || 'Randomtrip',
            homeLocation: t.location || undefined,
          }),
        }}
      />
    </main>
  );
}
