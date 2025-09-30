import { getTravellerData, getAllTravellerSlugs } from '@/lib/travellerTypes';
import type { CSSProperties } from 'react';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

// Dynamic imports for better code splitting
import dynamic from 'next/dynamic';

// Component mapping for dynamic imports
const COMPONENT_MAP = {
  // Generic components
  Hero: dynamic(() => import('@/components/by-type/Hero'), { ssr: true }),
  IntroBlock: dynamic(() => import('@/components/by-type/IntroBlock'), {
    ssr: true,
  }),
  ImageMosaic: dynamic(() => import('@/components/by-type/ImageMosaic'), {
    ssr: false,
  }),
  BenefitGrid: dynamic(() => import('@/components/by-type/BenefitGrid'), {
    ssr: true,
  }),
  LevelsSection: dynamic(() => import('@/components/by-type/LevelsSection'), {
    ssr: true,
  }),
  CtaBand: dynamic(() => import('@/components/by-type/CtaBand'), { ssr: true }),

  // Specific pages
  CouplePage: dynamic(() => import('../couple/page'), { ssr: true }),

  // Solo sections
  SoloHero: dynamic(() => import('@/components/by-type/solo/SoloHero'), {
    ssr: true,
  }),
  SoloIntro: dynamic(() => import('@/components/by-type/solo/SoloIntro'), {
    ssr: true,
  }),
  SoloPlanner: dynamic(() => import('@/components/by-type/solo/SoloPlanner'), {
    ssr: false,
  }),
} as const;

/**
 * Canonicalización local SOLO para este archivo:
 * (no tiene que coincidir con las claves del JSON; esto es para slug/UI)
 */
const ALIAS: Record<string, string> = {
  // family
  families: 'family',
  familia: 'family',

  // honeymoon
  honeymoons: 'honeymoon',

  // group
  groups: 'group',
  grupo: 'group',

  // parejas → couple
  parejas: 'couple',
  pareja: 'couple',
  couples: 'couple',

  // solo
  solos: 'solo',

  // paws
  paw: 'paws',
};

const canonicalType = (raw: string) => {
  const k = raw?.toLowerCase?.();
  return (ALIAS[k] ?? k) as string;
};

// Slugs con página dedicada (NO renderizar aquí; redirigir)
const DEDICATED: Set<string> = new Set([
  'family',
  'honeymoon',
  'group',
  'paws',
]);

// --- Enhanced Static Generation ---
export async function generateStaticParams() {
  const slugs = getAllTravellerSlugs();

  // Generate params for dynamic routes only
  const dynamicSlugs = slugs
    .filter((t) => !DEDICATED.has(canonicalType(t)))
    .map((type) => ({ type }));

  // Add fallback for common aliases
  const aliasParams = Object.entries(ALIAS)
    .filter(([alias, canonical]) => !DEDICATED.has(canonical))
    .map(([alias, canonical]) => ({ type: alias }));

  return [...dynamicSlugs, ...aliasParams];
}

// --- Loading Component ---
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// --- Component Mapping Function ---
function renderPageByType(type: string, data?: any) {
  // Special case: Couple page
  if (type === 'couple') {
    return <COMPONENT_MAP.CouplePage />;
  }

  // Special case: Solo page
  if (type === 'solo') {
    return (
      <main>
        <COMPONENT_MAP.SoloHero />
        <COMPONENT_MAP.SoloIntro />
        <COMPONENT_MAP.SoloPlanner />
      </main>
    );
  }

  // Generic flow for other types
  if (!data) return null;

  const style = {
    '--rt-primary': data.palette.primary,
    '--rt-secondary': data.palette.secondary,
    '--rt-accent': data.palette.accent,
    '--rt-text': data.palette.text,
  } as CSSProperties;

  return (
    <main style={style}>
      <COMPONENT_MAP.Hero data={data} />
      <COMPONENT_MAP.IntroBlock type={data.slug} palette={data.palette} />
      <COMPONENT_MAP.ImageMosaic type={data.slug} />
      <COMPONENT_MAP.BenefitGrid type={data.slug} palette={data.palette} />
      <section className="bg-white text-slate-900">
        <COMPONENT_MAP.LevelsSection type={data.slug} palette={data.palette} />
      </section>
      <COMPONENT_MAP.CtaBand palette={data.palette} />
    </main>
  );
}

// --- Main Page Component ---
export default async function Page({ params }: { params: { type: string } }) {
  const type = canonicalType(params.type);

  // // Redirect to dedicated pages
  // if (DEDICATED.has(type)) {
  //   redirect(`/packages/by-type/${type}`);
  // }

  // // Special case: Couple page
  // if (type === 'couple') {
  //   return (
  //     <Suspense fallback={<LoadingSkeleton />}>{/* <CouplePage /> */}</Suspense>
  //   );
  // }

  // // Special case: Solo page with optimized structure
  // if (type === 'solo') {
  //   return (
  //     <main>
  //       <Suspense fallback={<LoadingSkeleton />}>
  //         <COMPONENT_MAP.SoloHero />
  //       </Suspense>
  //       <Suspense fallback={<LoadingSkeleton />}>
  //         <COMPONENT_MAP.SoloIntro />
  //       </Suspense>
  //       <Suspense fallback={<LoadingSkeleton />}>
  //         <COMPONENT_MAP.SoloPlanner />
  //       </Suspense>
  //     </main>
  //   );
  // }

  // // Get data with error handling
  // const data = getTravellerData(type) ?? {
  //   slug: type,
  //   heroTitle: 'Ruta con Alma',
  //   subcopy: 'Preparamos la sorpresa; tú te quedas con la historia.',
  //   palette: {
  //     primary: '#FFF',
  //     secondary: '#0A2240',
  //     accent: '#F2C53D',
  //     text: '#212121',
  //   },
  //   images: { hero: '' },
  // };

  // const style = {
  //   '--rt-primary': data.palette.primary,
  //   '--rt-secondary': data.palette.secondary,
  //   '--rt-accent': data.palette.accent,
  //   '--rt-text': data.palette.text,
  // } as CSSProperties;

  return <LoadingSkeleton />;
  // Generic flow with optimized loading
  return (
    <main>
      {/* <Suspense fallback={<LoadingSkeleton />}>
        <COMPONENT_MAP.Hero data={data} />
      </Suspense>
      <Suspense fallback={<LoadingSkeleton />}>
        <COMPONENT_MAP.IntroBlock type={data.slug} palette={data.palette} />
      </Suspense>
      <Suspense
        fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}
      >
        <COMPONENT_MAP.ImageMosaic type={data.slug} />
      </Suspense>
      <Suspense fallback={<LoadingSkeleton />}>
        <COMPONENT_MAP.BenefitGrid type={data.slug} palette={data.palette} />
      </Suspense>
      <section className="bg-white text-slate-900">
        <Suspense fallback={<LoadingSkeleton />}>
          <COMPONENT_MAP.LevelsSection
            type={data.slug}
            palette={data.palette}
          />
        </Suspense>
      </section>
      <Suspense fallback={<LoadingSkeleton />}>
        <COMPONENT_MAP.CtaBand palette={data.palette} />
      </Suspense> */}
      <Suspense fallback={<LoadingSkeleton />}>
        {/* <COMPONENT_MAP.FooterLanding /> */}
      </Suspense>
    </main>
  );
}
