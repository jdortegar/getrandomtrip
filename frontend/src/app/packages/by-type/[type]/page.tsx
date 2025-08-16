import { getTravellerData, getAllTravellerSlugs } from '@/lib/travellerTypes';
import type { Metadata } from 'next';

// Import new components
import Hero from '@/components/by-type/Hero';
import IntroBlock from '@/components/by-type/IntroBlock';
import ImageMosaic from '@/components/by-type/ImageMosaic';
import BenefitGrid from '@/components/by-type/BenefitGrid';
import LevelsSection from '@/components/by-type/LevelsSection';
import CtaBand from '@/components/by-type/CtaBand';
import CouplePage from '../../(by-type)/couple/page'; // Import the new CouplePage

export function generateStaticParams() {
  return getAllTravellerSlugs().map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: { type: string } }): Promise<Metadata> {
  if (params.type === "couple") {
    return { title: "En Pareja | Randomtrip" }; // Use metadata from CouplePage
  }
  const base = {
    slug: params.type,
    heroTitle: 'Ruta con Alma',
    subcopy: 'Preparamos la sorpresa; tú te quedas con la historia.',
    palette: { primary:'#FFF', secondary:'#0A2240', accent:'#F2C53D', text:'#212121' },
    images: { hero: '/images/travellers/solo/hero.svg' },
    seoDescription: 'Descubre tu próxima aventura sorpresa con Randomtrip.'
  };
  const data = getTravellerData(params.type) ?? base;

  return {
    title: data.heroTitle,
    description: data.seoDescription,
    openGraph: {
      images: [data.images.hero],
    },
  };
}

export default function Page({ params }:{
  params: { type: string }
}) {
  if (params.type === "couple") {
    return <CouplePage />;
  }

  const base = {
    slug: params.type,
    heroTitle: 'Ruta con Alma',
    subcopy: 'Preparamos la sorpresa; tú te quedas con la historia.',
    palette: { primary:'#FFF', secondary:'#0A2240', accent:'#F2C53D', text:'#212121' },
    images: { hero: '/images/travellers/solo/hero.svg' },
  };

  const data = getTravellerData(params.type) ?? base;

  const style = {
    '--rt-primary': data.palette.primary,
    '--rt-secondary': data.palette.secondary,
    '--rt-accent': data.palette.accent,
    '--rt-text': data.palette.text,
  } as React.CSSProperties;

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
    </main>
  );
}