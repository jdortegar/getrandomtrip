import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';

export const pawsHeroContent: HeroContent = {
  title: 'Paws© Randomtrip',
  subtitle:
    'Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amig@ de cuatro patas también es protagonista.',
  tagline: 'Aventuras con huella',
  scrollText: 'SCROLL',
  videoSrc: '/videos/paws-hero-video.mp4',
  fallbackImage: '/images/journey-types/paws-card.jpg',
  //   tags: [
  //     { label: 'Pet-Friendly', value: '🐶 Pet-friendly garantizado' },
  //     { label: 'Logística', value: '✈️ Logística sin estrés' },
  //     { label: 'Experiencias', value: '🌳 Experiencias para ambos' },
  //   ],
  primaryCta: {
    text: '🐾 RANDOMTRIP-paws!',
    href: '#paws-planner',
    ariaLabel: 'Comienza tu viaje con tu mascota',
  },
  secondaryCta: {
    text: '✨ Relatos que inspiran',
    href: '#paws-blog',
    ariaLabel: 'Ver relatos de viajes con mascotas',
  },
};

export const pawsStoryContent = {
  title: 'Aventura con Huella',
  paragraphs: [
    'Dicen que la vida es mejor con compañía… y pocas compañías son tan leales como la que te espera al llegar a casa con un movimiento de cola o un ronroneo.',
    'En PAWS© RANDOMTRIP creemos que los viajes no deberían dejar a nadie atrás. Diseñamos escapadas donde tu mascota no es un problema logístico, sino parte esencial de la aventura.',
    'Un camino nuevo huele distinto; un bosque tiene sonidos que despiertan curiosidad; una playa es territorio para correr sin relojes. Ellos no solo te acompañan: te enseñan a viajar distinto.',
    'Porque algunas huellas se dejan en la arena, y otras, para siempre en la memoria.',
  ],
  tagline: 'Wonder • Wander • Repeat',
};
