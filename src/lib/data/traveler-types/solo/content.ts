import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';

export const soloHeroContent: HeroContent = {
  title: 'Solo© Randomtrip',
  subtitle:
    'Tu viaje, tus reglas. Descubre destinos únicos diseñados para la libertad de viajar solo.',
  tagline: 'Aventura personal. Sin compromisos.',
  scrollText: 'SCROLL',
  videoSrc: '/videos/solo-hero-video.mp4',
  fallbackImage: '/images/journey-types/solo-traveler.jpg',
  primaryCta: {
    text: 'RANDOMTRIPME!',
    href: '#solo-planner',
    ariaLabel: 'Ir a la sección de planificación de viaje',
  },
  // secondaryCta: {
  //   text: 'Historias inspiradoras',
  //   href: '#solo-blog',
  //   ariaLabel: 'Ir a la sección de blog',
  // },
};

export const soloStoryContent = {
  title: 'Libertad en estado puro',
  paragraphs: [
    'No hay que negociar restaurantes. No hay que esperar a nadie en el baño. No hay "cinco minutos más" que se convierten en media hora. Solo vos, un destino secreto, y la libertad de cambiarlo todo sobre la marcha.',
    'Viajar solo no es "no tener con quién". Es tener TODO el control. Es decidir quedarte una hora más en ese bar porque sí. Es perderte a propósito. Es irte del museo porque te aburrió, sin culpa ni explicaciones.',
    'Y acá, encima, ni siquiera sabés dónde vas a caer. Podés amanecer en una playa solitaria o en un pueblo de montaña donde nadie habla tu idioma. El único plan es que no hay plan. Y eso, querido viajero solitario, es libertad con mayúsculas.',
    'Tu nombre en la reserva. El destino, en suspenso. Y cuando llegues, vas a entender por qué hay cosas que solo se descubren yendo sin compañía: te encontrás a vos mismo, sin filtro, sin pose, sin Netflix compartido.',
  ],
  tagline: 'Solo, pero nunca solo',
};
