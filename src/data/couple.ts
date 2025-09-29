import type { HeroContent } from '@/components/Hero';

export const coupleHeroContent: HeroContent = {
  title: 'Bond© Randomtrip',
  subtitle:
    'El viaje debe ser tan único como ustedes. Descubran destinos secretos juntos.',
  tagline: 'Sorpresa para ustedes. Sin spoilers.',
  features: [
    { highlight: 'Revelación', label: '48h antes se revela' },
    { highlight: 'Flexibilidad', label: 'Flex reprogramación' },
    { highlight: 'Seguridad', label: 'Pago seguro' },
  ],
  primaryCta: {
    text: 'RANDOMTRIP-us!',
    href: '#couple-planner?step=budget',
    sectionId: 'couple-planner',
  },
  secondaryCta: {
    text: 'Relatos que inspiran',
    href: '#couple-blog',
    sectionId: 'couple-blog',
  },
};

export const coupleVideoConfig = {
  webmSrc: '/videos/couple-hero-video.webm',
  mp4Src: '/videos/couple-hero-video.mp4',
  fallbackImage: '/images/journey-types/couple-traveler.jpg',
  poster: '/images/journey-types/couple-traveler.jpg',
};

export const coupleStoryContent = {
  title: 'Amor clasificado',
  paragraphs: [
    'Nadie sabrá dónde estarán. Ni siquiera ustedes… todavía. Y créanme: eso está buenísimo. Porque si algo mata la magia de un viaje es ese Excel de horarios que se arma el primo que "sabe organizar".',
    'Acá no habrá Excel, ni folletos de agencia con gente sonriendo falsamente. Habrá alguien —que no son ustedes— y armaremos todo para que parezca improvisado. Ustedes, mientras tanto, no sabrán si al día siguiente amanecerán viendo el mar o escuchando gallos… y eso, mis enamorados, es arte.',
    'Ningún mapa lo marca. Ningún blog lo recomienda. Solo ustedes dos, caminando por lugares que parecerán inventados para que nadie más los vea. Un itinerario bajo llave, como las recetas de la abuela, que jura llevarse a la tumba… y después termina contando en un casamiento.',
    'En la reserva estarán sus nombres. El destino, no. Y ahí empezará la novela: desayuno acá, un beso allá, un atardecer que no pidieron pero igual se llevarán de recuerdo. Lo único seguro es que volverán con anécdotas imposibles de explicar sin gestos y sin exagerar… y con ganas de repetir, como cuando una canción que nos gusta termina y uno aprieta "otra vez".',
  ],
  tagline: 'Wonder • Wander • Repeat',
};
