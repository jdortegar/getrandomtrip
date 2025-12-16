import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';

export const coupleHeroContent: HeroContent = {
  title: 'Bond© Randomtrip',
  subtitle:
    'El viaje debe ser tan único como ustedes. Descubran destinos secretos juntos.',
  tagline: 'Sorpresa para ustedes. Sin spoilers.',
  // tags: [
  //   { label: 'Revelación', value: '48h antes se revela' },
  //   { label: 'Flexibilidad', value: 'Flex reprogramación' },
  //   { label: 'Seguridad', value: 'Pago seguro' },
  // ],
  scrollText: 'SCROLL',
  videoSrc:
    'https://ocqketmaavn5dczt.public.blob.vercel-storage.com/videos/couple-hero-video.mp4',
  fallbackImage: '/images/journey-types/couple-traveler.jpg',
  primaryCta: {
    text: 'RANDOMTRIP-us!',
    href: '#couple-planner',
    ariaLabel: 'Ir a la sección de planificación de viaje',
  },
  // secondaryCta: {
  //   text: 'Relatos que inspiran',
  //   href: '#couple-blog',
  //   ariaLabel: 'Ir a la sección de blog',
  // },
};

export const coupleStoryContent: ParagraphContent = {
  title: 'Amor clasificado',
  paragraphs: [
    'Nadie sabrá dónde estarán. Ni siquiera ustedes… todavía. Y créanme: eso está buenísimo. Porque si algo mata la magia de un viaje es ese Excel de horarios que se arma el primo que "sabe organizar".',
    'Acá no habrá Excel, ni folletos de agencia con gente sonriendo falsamente. Habrá alguien —que no son ustedes— y armaremos todo para que parezca improvisado. Ustedes, mientras tanto, no sabrán si al día siguiente amanecerán viendo el mar o escuchando gallos… y eso, mis enamorados, es arte.',
    'Ningún mapa lo marca. Ningún blog lo recomienda. Solo ustedes dos, caminando por lugares que parecerán inventados para que nadie más los vea. Un itinerario bajo llave, como las recetas de la abuela, que jura llevarse a la tumba… y después termina contando en un casamiento.',
    'En la reserva estarán sus nombres. El destino, no. Y ahí empezará la novela: desayuno acá, un beso allá, un atardecer que no pidieron pero igual se llevarán de recuerdo. Lo único seguro es que volverán con anécdotas imposibles de explicar sin gestos y sin exagerar… y con ganas de repetir, como cuando una canción que nos gusta termina y uno aprieta "otra vez".',
  ],
  tagline: 'tagline',
};
