
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { COUPLE_ALMA_OPTIONS } from '@/components/by-type/couple/coupleAlmaOptions';

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full px-3 py-1 text-sm font-medium bg-white/80 text-neutral-900 backdrop-blur ring-1 ring-black/10 shadow-sm">
      {children}
    </span>
  );
}

const FROM_LABEL: Record<string, string> = {
  couple: 'En Pareja',
  group: 'En Grupo',
  family: 'En Familia',
  solo: 'Solo',
};

const TIER_LABEL: Record<string, string> = {
  'essenza': 'Essenza',
  'modo-explora': 'Modo Explora',
  'explora-plus': 'Explora+',
  'bivouac': 'Bivouac',
  'atelier-getaway': 'Atelier Getaway',
};

const TRANSPORT_LABEL: Record<string, string> = {
  plane: 'Avión',
  bus: 'Bus',
  train: 'Tren',
  car: 'Auto',
};

export default function BasicConfigHero() {
  const sp = useSearchParams();

  const from = sp.get('from') ?? '';
  const budgetTier = sp.get('budgetTier') ?? '';
  const coupleAlma = sp.get('coupleAlma') ?? '';
  const almaOptions = (sp.get('almaOptions') ?? '').split(',').filter(Boolean);
  const transport = sp.get('transport') ?? '';
  const filters = (sp.get('filters') ?? '').split(',').filter(Boolean);

  const labels = useMemo(() => {
    const byTraveller = FROM_LABEL[from] || '—';
    const nivel = TIER_LABEL[budgetTier] || '—';
    const almaSpec = COUPLE_ALMA_OPTIONS[coupleAlma];
    const excusa = almaSpec?.title ?? '—';
    const opciones = almaOptions.length > 0 ? `${almaOptions.length} opciones` : 'Sin opciones';
    const transporte = TRANSPORT_LABEL[transport] || (transport ? transport : 'A definir');
    const filtros = filters.length > 0 ? `${filters.length} filtros` : 'Sin filtros adicionales';
    return { byTraveller, nivel, excusa, opciones, transporte, filtros };
  }, [from, budgetTier, coupleAlma, almaOptions, transport, filters]);

  return (
    <div className="relative min-h-[260px] md:min-h-[320px]">
      {/* Vídeo de fondo */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <video
          className="h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          poster="/images/basic-config-hero-fallback.jpg"
        >
            <source src="/videos/basic-config-video-hero.webm" type="video/webm" />
            <source src="/videos/basic-config-video-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60" />
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-6 text-center text-white">
        <h2 className="font-display text-3xl md:text-4xl">Diseñen su Randomtrip</h2>
        <p className="mt-1 text-sm text-white/90">
          Tres pasos sencillos para vivir una historia que nadie más podrá contar.
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Chip>By Traveller: {labels.byTraveller}</Chip>
          <Chip>Nivel: {labels.nivel}</Chip>
          {labels.excusa !== '—' && <Chip>Excusa: {labels.excusa}</Chip>}
          <Chip>{labels.opciones}</Chip>
          <Chip>Transporte: {labels.transporte}</Chip>
          <Chip>{labels.filtros}</Chip>
        </div>
      </div>
    </div>
  );
}
