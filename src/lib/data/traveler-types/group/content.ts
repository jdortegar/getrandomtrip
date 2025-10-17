import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';

export const groupHeroContent: HeroContent = {
  title: 'CREW© RANDOMTRIP',
  subtitle:
    'Equipos, amigos, intereses en común: diseñamos escapadas que funcionan para todos.',
  tagline: 'Los mejores momentos se viven en plural',
  scrollText: 'SCROLL',
  videoSrc: '/videos/group-hero-video.mp4',
  fallbackImage: '/images/journey-types/friends-group.jpg',
  //   tags: [
  //     { label: 'Sincronía', value: 'Todos sincronizados' },
  //     { label: 'Diversión', value: 'Más risas por m²' },
  //     { label: 'Logística', value: 'Logística sin fricción' },
  //   ],
  primaryCta: {
    text: 'RANDOMTRIP-all!',
    href: '#group-planner',
    ariaLabel: 'Comienza tu viaje en grupo',
  },
  secondaryCta: {
    text: 'Relatos que inspiran',
    href: '#group-blog',
    ariaLabel: 'Ir a la sección de blog',
  },
};

export const groupStoryContent = {
  title: 'Momentos en Plural',
  paragraphs: [
    'Los mejores recuerdos no se cuentan solos. Se construyen entre miradas, brindis y carcajadas que rebotan de un lado a otro. Porque los momentos, cuando se viven en grupo, pesan más. Tienen gravedad propia.',
    'Acá no se trata de coordinar vuelos ni de discutir destinos. Se trata de entregarse a la sorpresa de estar juntos, sin que nadie tenga que hacer de organizador. Ustedes llegan con la historia; nosotros la convertimos en escenario.',
    'Será una sobremesa que se extiende hasta la madrugada, una caminata que se transforma en ritual, un viaje que se volverá leyenda compartida. Porque lo que empieza en plural, siempre se recuerda en mayúsculas.',
  ],
  tagline: 'Wonder • Wander • Repeat',
};
