import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';

export const honeymoonHeroContent: HeroContent = {
  title: 'Nuptia© Randomtrip',
  subtitle:
    'La luna de miel no es un destino, es el primer capítulo de su vida juntos. Nosotros diseñamos la sorpresa; ustedes se encargan de vivirla.',
  tagline: 'El comienzo de una historia única',
  scrollText: 'SCROLL',
  videoSrc: '/videos/honeymoon-video.mp4',
  fallbackImage: '/images/journey-types/honeymoon-same-sex.jpg',
  //   tags: [
  //     { label: 'Diseño', value: 'Viajes sin coordenadas fijas' },
  //     { label: 'Personalización', value: 'Experiencias a medida' },
  //     { label: 'Exclusividad', value: 'Intimidad y magia compartida' },
  //   ],
  primaryCta: {
    text: 'RANDOMTRIP-us!',
    href: '#honeymoon-planner',
    ariaLabel: 'Comienza tu luna de miel',
  },
  secondaryCta: {
    text: 'Relatos que inspiran',
    href: '#honeymoon-blog',
    ariaLabel: 'Ir a la sección de blog',
  },
};

export const honeymoonStoryContent = {
  title: 'El comienzo invisible que nadie más verá',
  paragraphs: [
    'El casamiento fue apenas un rito, un momento donde el amor se hizo público. Pero la luna de miel… la luna de miel es el instante privado en el que dos miradas se buscan sin testigos.',
    'No hay coordenadas precisas para ese viaje. Porque lo que importa no es el lugar al que se llega, sino lo que cada paso revela del otro. Una risa inesperada en medio de una caminata, un silencio compartido frente al mar, la certeza de que hay alguien que nos acompaña incluso cuando no decimos nada.',
    'Nosotros proponemos el escenario, ustedes escribirán el guion invisible que nadie más podrá repetir. Porque hay viajes que se terminan al regresar, y otros —los verdaderos— que empiezan cuando entendemos que el destino es, en realidad, el vínculo que construimos cada día. La luna de miel no es el epílogo de una fiesta. Es el prólogo de una historia que recién comienza.',
  ],
  tagline: 'Wonder • Wander • Repeat',
};
