import { getTravellerData, getAllTravellerSlugs } from '@/lib/travellerTypes';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

// Import new components
import Hero from '@/components/by-type/Hero';
import IntroBlock from '@/components/by-type/IntroBlock';
import ImageMosaic from '@/components/by-type/ImageMosaic';
import BenefitGrid from '@/components/by-type/BenefitGrid';
import LevelsSection from '@/components/by-type/LevelsSection';
import CtaBand from '@/components/by-type/CtaBand';
import CouplePage from '../../(by-type)/couple/page';
import SoloHero from '@/components/by-type/solo/SoloHero';
import SoloInspiration from '@/components/by-type/solo/SoloInspiration';
import SoloTestimonials from '@/components/by-type/solo/SoloTestimonials';
import FooterLanding from '@/components/layout/FooterLanding';

const VIDEO_BY_TYPE: Record<string, string> = {
  family: "/videos/family-hero-video.mp4",
  families: "/videos/family-hero-video.mp4",
  group: "/videos/group-hero-video.mp4",
  honeymoon: "/videos/honeymoon-video.mp4",
  paws: "/videos/paws-hero-video.mp4",
};

export async function generateMetadata(
  { params }: { params: { type: string } }
): Promise<Metadata> {
  const map: Record<string, string> = {
    couple: 'En Pareja | Randomtrip',
    solo: 'Solo | Randomtrip',
    families: 'En Familia | Randomtrip',
    family: 'En Familia | Randomtrip', // alias
  };
  return { title: map[params.type] ?? 'Randomtrip' };
}

export function generateStaticParams() {
  return getAllTravellerSlugs().map((type) => ({ type }));
}

export default function Page({
  params,
}: {
  params: { type: string };
}) {
  if (params.type === 'couple') {
    return <CouplePage />;
  }

  const base = {
    slug: params.type,
    heroTitle: 'Ruta con Alma',
    subcopy: 'Preparamos la sorpresa; tú te quedas con la historia.',
    palette: { primary: '#FFF', secondary: '#0A2240', accent: '#F2C53D', text: '#212121' },
    images: { hero: '/images/travellers/solo/hero.svg' },
  };

  const data = getTravellerData(params.type) ?? base;

  const style = {
    '--rt-primary': data.palette.primary,
    '--rt-secondary': data.palette.secondary,
    '--rt-accent': data.palette.accent,
    '--rt-text': data.palette.text,
  } as CSSProperties;

  if (params.type === 'solo') {
    return (
      <main style={style}>
        {/* Sección 1: Hero */}
        <SoloHero />

        {/* Sección 2: Planes */}
        <section id="planes" className="relative scroll-mt-16 bg-neutral-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <LevelsSection type="solo" palette={data.palette} />
          </div>
        </section>

        {/* Sección 3: Inspiración / Blog */}
        <SoloInspiration />

        {/* Sección 4: Testimonios (uniforme con couple/families/group) */}
        <SoloTestimonials />

        {/* Footer */}
        <FooterLanding />
      </main>
    );
  }

  // Otros tipos (/families, /family, etc.)
  const videoSrc = VIDEO_BY_TYPE[params.type]; // Get video source based on type

  return (
    <main style={style}>
      <Hero data={data} videoSrc={videoSrc} /> {/* Pass videoSrc to Hero */}
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
