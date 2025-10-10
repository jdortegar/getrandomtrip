'use client';

import Hero from '@/components/Hero';
import { usePlanData } from '@/hooks/usePlanData';

export default function BasicConfigHero() {
  const { tags } = usePlanData();

  // Create hero content for basic config
  const heroContent = {
    title: 'Cada viaje es un relato. Este empieza aquí.',
    subtitle: 'Marquen desde dónde parten y prepárense para lo inesperado.',
    tagline: '',
    ctaText: 'Continuar Configuración',
    ctaHref: '#journey-config',
    ctaAriaLabel: 'Continuar con la configuración del viaje',
    scrollText: 'SCROLL',
    videoSrc:
      'https://ocqketmaavn5dczt.public.blob.vercel-storage.com/videos/basic-config-video-hero.mp4',
    fallbackImage: '/images/basic-config-hero-fallback.jpg',
    tags,
  };

  return (
    <Hero
      content={heroContent}
      id="basic-config-hero"
      className="!h-[50vh]"
      titleClassName="!text-4xl"
      scrollIndicator={false}
    />
  );
}
