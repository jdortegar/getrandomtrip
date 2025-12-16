import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';

export const familyHeroContent: HeroContent = {
  title: 'Kin© Randomtrip',
  subtitle:
    'Viajar en familia es moverse, es descubrirse, es crear anécdotas que después se contarán mil veces en la sobremesa.',
  tagline: 'Escapadas diseñadas para toda la familia',
  scrollText: 'SCROLL',
  videoSrc: '/videos/family-hero-video.mp4',
  fallbackImage: '/images/journey-types/family-traveler.jpg',
  //   tags: [
  //     { label: 'Edades', value: 'Para todas las edades' },
  //     { label: 'Diseño', value: 'Planes diseñados sin estrés' },
  //     { label: 'Flexibilidad', value: 'Flex reprogramación' },
  //   ],
  primaryCta: {
    text: 'RANDOMTRIP-we!',
    href: '#family-planner',
    ariaLabel: 'Comienza tu viaje en familia',
  },
  // secondaryCta: {
  //   text: 'Relatos que inspiran',
  //   href: '#family-blog',
  //   ariaLabel: 'Ir a la sección de blog',
  // },
};

export const familyStoryContent = {
  title: 'En Familia',
  paragraphs: [
    'Una escapada en familia no empieza en la ruta, en el aeropuerto, ni en la estación, sino en la mesa de la cocina, cuando alguien dice "¿y si…?". Ese disparador sencillo, entre un plato de pasta y la discusión sobre quién lava los platos, es donde nacen las mejores aventuras.',
    'En Randomtrip sabemos que no hace falta cruzar medio mundo para sentirse lejos: basta un par de días para mirar a los tuyos de otra manera. Los más chicos convierten cualquier rincón en un parque, los adolescentes descubren que aún pueden sorprenderse, y los abuelos vuelven a reír con ganas.',
    'Diseñamos escapadas sin moldes ni guiones. Breves, intensas, llenas de momentos que se inventan paso a paso. Días que pasan volando, noches que quedan en la memoria, historias que se contarán en cada sobremesa. Porque las escapadas terminan, pero las historias quedan.',
  ],
  tagline: 'tagline',
};
