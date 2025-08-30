import { getTravellerData, getAllTravellerSlugs } from '@/lib/travellerTypes';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

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
import SoloHero from '@/components/by-type/solo/SoloHero';
import SoloInspiration from '@/components/by-type/solo/SoloInspiration';
import SoloTestimonials from '@/components/by-type/solo/SoloTestimonials';
import FamilyHero from '@/components/by-type/family/FamilyHero';

// --- Canonicalización de tipos ---
const ALIAS: Record<string, string> = {
  families: 'family',
  familia: 'family',
};
const canonicalType = (raw: string) => ALIAS[raw] ?? raw;

// --- Metadata ---
export async function generateMetadata(
  { params }: { params: { type: string } }
): Promise<Metadata> {
  const type = canonicalType(params.type);
  const map: Record<string, string> = {
    couple: 'En Pareja | Randomtrip',
    solo: 'Solo | Randomtrip',
    family: 'En Familia | Randomtrip',
  };
  return { title: map[type] ?? 'Randomtrip' };
}

// --- Pre-render ---
export function generateStaticParams() {
  // Mantén tu fuente actual; si incluye alias, no pasa nada
  return getAllTravellerSlugs().map((type) => ({ type }));
}

// --- Página ---
export default function Page({ params }: { params: { type: string } }) {
  const type = canonicalType(params.type);

  // Caso especial: pareja usa su página propia
  if (type === 'couple') {
    return <CouplePage />;
  }

  // Datos base y paleta
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

  // Caso especial: SOLO (tiene layout distinto)
  if (type === 'solo') {
    return (
      <main style={style}>
        <SoloHero />
        <section id="planes" className="relative scroll-mt-16 bg-neutral-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <LevelsSection type="solo" palette={data.palette} />
          </div>
        </section>
        <SoloInspiration />
        <SoloTestimonials />
        <FooterLanding />
      </main>
    );
  }

  // Caso especial: FAMILY -> usar tu landing específica (FamilyHero) + secciones comunes
  if (type === 'family') {
    return (
      <main style={style}>
        <FamilyHero />
        <IntroBlock type="family" palette={data.palette} />
        <ImageMosaic type="family" />
        <BenefitGrid type="family" palette={data.palette} />
        <section className="bg-white text-slate-900">
          <LevelsSection type="family" palette={data.palette} />
        </section>
        <CtaBand palette={data.palette} />
        <FooterLanding />
      </main>
    );
  }

  // Resto de tipos -> flujo genérico existente
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
