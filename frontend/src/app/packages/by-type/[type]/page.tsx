import { getTravellerData, getAllTravellerSlugs } from '@/lib/travellerTypes';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { redirect } from 'next/navigation';

// Generales
import Hero from '@/components/by-type/Hero';
import IntroBlock from '@/components/by-type/IntroBlock';
import ImageMosaic from '@/components/by-type/ImageMosaic';
import BenefitGrid from '@/components/by-type/BenefitGrid';
import LevelsSection from '@/components/by-type/LevelsSection';
import CtaBand from '@/components/by-type/CtaBand';
import FooterLanding from '@/components/layout/FooterLanding';

// Páginas/Secciones específicas
import CouplePage from '../../(by-type)/couple/page';

// SOLO: importa las 3 secciones
import SoloHero from '@/components/by-type/solo/SoloHero';
import SoloIntro from '@/components/by-type/solo/SoloIntro';
import SoloPlanner from '@/components/by-type/solo/SoloPlanner';

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
const DEDICATED: Set<string> = new Set(['family', 'honeymoon', 'group', 'paws']);

// --- Metadata ---
export async function generateMetadata(
  { params }: { params: { type: string } }
): Promise<Metadata> {
  const type = canonicalType(params.type);
  const map: Record<string, string> = {
    couple: 'En Pareja | Randomtrip',
    solo: 'Solo | Randomtrip',
    family: 'En Familia | Randomtrip',
    honeymoon: 'Honeymoon | Randomtrip',
    group: 'En Grupo | Randomtrip',
    paws: 'Paws | Randomtrip',
  };
  return { title: map[type] ?? 'Randomtrip' };
}

// --- Pre-render ---
// IMPORTANT: solo generamos los slugs que deben vivir en la dinámica.
export function generateStaticParams() {
  return getAllTravellerSlugs()
    // Blindaje extra por si alguien deja un slug dedicado en la lista
    .filter((t) => !DEDICATED.has(canonicalType(t)))
    .map((type) => ({ type }));
}

// --- Página ---
export default function Page({ params }: { params: { type: string } }) {
  const type = canonicalType(params.type);

  // Si el slug corresponde a una página dedicada, redirigimos a ella
  if (DEDICATED.has(type)) {
    redirect(`/packages/by-type/${type}`);
  }

  // Caso especial: pareja usa su página propia (componente dedicado embebido aquí)
  if (type === 'couple') {
    return <CouplePage />;
  }

  // Caso especial: SOLO → Hero + Intro + Planner (el planner arranca en Presupuesto)
  if (type === 'solo') {
    return (
      <main>
        <SoloHero />
        <SoloIntro />
        <SoloPlanner />
      </main>
    );
  }

  // Datos base y paleta (para los tipos genéricos)
  const data = getTravellerData(type) ?? {
    slug: type,
    heroTitle: 'Ruta con Alma',
    subcopy: 'Preparamos la sorpresa; tú te quedas con la historia.',
    palette: { primary: '#FFF', secondary: '#0A2240', accent: '#F2C53D', text: '#212121' },
    images: { hero: '' },
  };

  const style = {
    '--rt-primary': data.palette.primary,
    '--rt-secondary': data.palette.secondary,
    '--rt-accent': data.palette.accent,
    '--rt-text': data.palette.text,
  } as CSSProperties;

  // Resto de tipos → flujo genérico
  return (
    <main style={style}>
      <Hero data={data} />
      <IntroBlock type={data.slug} palette={data.palette} />
      <ImageMosaic type={data.slug} />
      <BenefitGrid type={data.slug} palette={data.palette} />
      <section className="bg-white text-slate-900">
        <LevelsSection type={data.slug} palette={data.palette} />
      </section>
      <CtaBand palette={data.palette} />
      <FooterLanding />
    </main>
  );
}
