import TripperHero from '@/components/tripper/TripperHero';
import TripperMap from '@/components/tripper/TripperMap';
import ImageMosaic from '@/components/by-type/ImageMosaic';
import BenefitGrid from '@/components/by-type/BenefitGrid';
import TripperTiers from '@/components/tripper/TripperTiers';
import CtaBand from '@/components/by-type/CtaBand';
import { getTripperBySlug, getAllTripperSlugs } from '@/content/trippers';
import { notFound } from 'next/navigation';
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { tripper: string } }): Promise<Metadata> {
  const t = getTripperBySlug(params.tripper);
  return {
    title: t?.metaTitle ?? `${t?.name ?? 'Tripper'} | Randomtrip`,
  };
}

export function generateStaticParams() {
  return getAllTripperSlugs().map(tripper => ({ tripper }));
}

export default function Page({ params }: { params: { tripper: string } }) {
  const data = getTripperBySlug(params.tripper);

  if (!data) return notFound();

  // Fallbacks seguros
  const palette = data?.palette ?? { primary:'#FFF', secondary:'#0A2240', accent:'#2463EB', text:'#212121' };
  const style = {
    ['--rt-primary' as any]: palette.primary,
    ['--rt-secondary' as any]: palette.secondary,
    ['--rt-accent' as any]: palette.accent,
    ['--rt-text' as any]: palette.text,
  } as React.CSSProperties;

  return (
    <main style={style}>
      <TripperHero data={data} />

      {/* sección clara por defecto */}
      <section className="bg-white text-slate-900">
        <TripperMap tripper={data} />
      </section>

      <ImageMosaic type={data?.travellerType ?? 'couples'} />
      <BenefitGrid type={data?.travellerType ?? 'couples'} palette={palette} />

      {/* Niveles: SIEMPRE claro */}
      <section className="bg-white text-slate-900">
        <TripperTiers
          tripper={{ ...data, tiersSource: data?.tiersSource ?? 'base' }}
          palette={palette}
          className="max-w-7xl mx-auto"
          ctaLabel="Reservar"
        />
      </section>

      <CtaBand palette={palette} />
    </main>
  );
}