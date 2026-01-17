import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const couple: TravelerTypeData = {
  meta: {
    slug: 'couple',
    label: 'En Pareja',
    aliases: ['parejas', 'pareja', 'couples'],
    pageTitle: 'En Pareja | Randomtrip',
  },
  content: {
    hero: {
      title: 'Bond© Randomtrip',
      subtitle:
        'El viaje debe ser tan único como ustedes. Descubran destinos secretos juntos.',
      tagline: 'Sorpresa para ustedes. Sin spoilers.',
      scrollText: 'SCROLL',
      videoSrc:
        'https://ocqketmaavn5dczt.public.blob.vercel-storage.com/videos/couple-hero-video.mp4',
      fallbackImage: '/images/journey-types/couple-traveler.jpg',
      primaryCta: {
        text: 'RANDOMTRIP-us!',
        href: '#couple-planner',
        ariaLabel: 'Ir a la sección de planificación de viaje',
      },
    } as HeroContent,
    story: {
      title: 'Amor clasificado',
      paragraphs: [
        'Nadie sabrá dónde estarán. Ni siquiera ustedes… todavía. Y créanme: eso está buenísimo. Porque si algo mata la magia de un viaje es ese Excel de horarios que se arma el primo que "sabe organizar".',
        'Acá no habrá Excel, ni folletos de agencia con gente sonriendo falsamente. Habrá alguien —que no son ustedes— y armaremos todo para que parezca improvisado. Ustedes, mientras tanto, no sabrán si al día siguiente amanecerán viendo el mar o escuchando gallos… y eso, mis enamorados, es arte.',
        'Ningún mapa lo marca. Ningún blog lo recomienda. Solo ustedes dos, caminando por lugares que parecerán inventados para que nadie más los vea. Un itinerario bajo llave, como las recetas de la abuela, que jura llevarse a la tumba… y después termina contando en un casamiento.',
        'En la reserva estarán sus nombres. El destino, no. Y ahí empezará la novela: desayuno acá, un beso allá, un atardecer que no pidieron pero igual se llevarán de recuerdo. Lo único seguro es que volverán con anécdotas imposibles de explicar sin gestos y sin exagerar… y con ganas de repetir, como cuando una canción que nos gusta termina y uno aprieta "otra vez".',
      ],
      eyebrow: 'Dos en movimiento',
    } as ParagraphContent,
  },
  planner: {
    title: 'Diseñen su Randomtrip en pareja',
    subtitle:
      'Tres pasos sencillos para vivir una historia que nadie más podrá contar.',
    levels: [
      {
        id: 'essenza',
        name: 'Essenza',
        subtitle: 'Lo esencial con estilo',
        priceLabel: 'Hasta 350 USD',
        priceFootnote: '· por persona',
        features: [
          { title: 'Duración', description: 'Máx 2 noches' },
          { title: 'Destinos', description: 'Destinos Nacionales' },
          {
            title: 'Transporte',
            description: 'Low cost (buses o vuelos off-peak).',
            footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
          },
          {
            title: 'Fechas',
            description: 'Menor disponibilidad, con restricciones y bloqueos.',
          },
          {
            title: 'Alojamiento',
            description: 'Midscale (3★ o equivalentes).',
          },
          { title: 'Extras', description: 'Guía esencial del destino.' },
          { title: 'Beneficios', description: 'No incluye' },
        ],
        closingLine: 'Perfecto para una escapada rápida y económica.',
        ctaLabel: 'Elegir Essenza →',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'explora',
        name: 'Modo Explora',
        subtitle: 'Aventura sin límites',
        priceLabel: 'Hasta 650 USD',
        priceFootnote: '· por persona',
        features: [
          { title: 'Duración', description: 'Hasta 4 noches' },
          { title: 'Destinos', description: 'Nacionales + Regionales' },
          {
            title: 'Transporte',
            description: 'Económico con opciones de upgrade.',
          },
          {
            title: 'Fechas',
            description: 'Mayor flexibilidad, algunas restricciones.',
          },
          {
            title: 'Alojamiento',
            description: 'Midscale+ (3-4★ o equivalentes).',
          },
          {
            title: 'Extras',
            description: 'Guía del destino + 1 experiencia incluida.',
          },
          { title: 'Beneficios', description: 'Soporte 24/7' },
        ],
        closingLine: 'Ideal para explorar más allá de lo obvio.',
        ctaLabel: 'Elegir Modo Explora →',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'exploraPlus',
        name: 'Explora+',
        subtitle: 'Experiencia premium',
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: '· por persona',
        features: [
          { title: 'Duración', description: 'Hasta 7 noches' },
          {
            title: 'Destinos',
            description: 'Internacionales + Nacionales Premium',
          },
          {
            title: 'Transporte',
            description: 'Premium con todas las comodidades.',
          },
          {
            title: 'Fechas',
            description: 'Máxima flexibilidad, sin restricciones.',
          },
          { title: 'Alojamiento', description: 'Lujo (5★ o equivalentes).' },
          {
            title: 'Extras',
            description: 'Guía personalizada + experiencias exclusivas.',
          },
          {
            title: 'Beneficios',
            description: 'Concierge 24/7 + upgrades automáticos',
          },
        ],
        closingLine: 'Para quienes buscan lo mejor de lo mejor.',
        ctaLabel: 'Elegir Explora+ →',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'bivouac',
        name: 'Bivouac',
        subtitle: 'Aventura sin límites',
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: '· por persona',
        features: [
          { title: 'Duración', description: 'Hasta 5 noches' },
          { title: 'Destinos', description: 'Toda América (sin límites)' },
          {
            title: 'Transporte',
            description: 'Multimodal con comodidad priorizada.',
          },
          { title: 'Fechas', description: 'Sin bloqueos.' },
          { title: 'Alojamiento', description: 'Upper-Upscale.' },
          {
            title: 'Extras',
            description: 'Guía personalizada + experiencias exclusivas.',
          },
          {
            title: 'Beneficios',
            description: 'Concierge 24/7 + upgrades automáticos',
          },
        ],
        closingLine: 'Para quienes buscan lo mejor de lo mejor.',
        ctaLabel: 'Elegir Bivouac →',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'atelier',
        name: 'Atelier Getaway',
        subtitle: 'Experiencia de lujo',
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: '· por persona',
        features: [
          {
            title: 'Duración',
            description: 'Customizable (5+ noches recomendadas)',
          },
          { title: 'Destinos', description: 'Sin límites geográficos' },
          {
            title: 'Transporte',
            description: 'First class con todas las comodidades.',
          },
          {
            title: 'Fechas',
            description: 'Máxima flexibilidad, sin restricciones.',
          },
          {
            title: 'Alojamiento',
            description: 'Luxury / de autor / cadenas A1.',
          },
          {
            title: 'Extras',
            description: 'Co-creación con Luxury Travel Advisor.',
          },
          {
            title: 'Beneficios',
            description: 'Equipo 24/7 + experiencias premium a medida',
          },
        ],
        closingLine: 'Para quienes buscan lo mejor de lo mejor.',
        ctaLabel: 'Elegir Atelier →',
        excuses: getExcusesByType('couple'),
      },
    ],
  } as TypePlannerContent,
  blog: {
    title: 'Historias de parejas aventureras',
    subtitle: 'Experiencias únicas que solo ustedes dos podrán vivir.',
    posts: [
      {
        image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
        category: 'Romance',
        title: '5 Razones para Amar un Viaje Sorpresa en Pareja',
      },
      {
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Consejos',
        title: 'Cómo Hacer la Valija para un Destino Desconocido',
      },
      {
        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
        category: 'Experiencias',
        title: 'La Historia de un Randomtrip a los Alpes',
      },
      {
        image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3',
        category: 'Guías',
        title: 'Sabores del Sudeste Asiático',
      },
      {
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Aventura',
        title: 'Recorriendo la Carretera Austral',
      },
      {
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Inspiración',
        title: 'Playas Escondidas de América Latina',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'Más Historias',
      subtitle: 'Descubre todas nuestras aventuras y experiencias únicas',
      href: '/blog',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'Lo que dicen nuestras parejas',
    items: [
      {
        author: 'María & Carlos',
        city: 'Buenos Aires',
        quote:
          'Fue la experiencia más increíble de nuestras vidas. No sabíamos a dónde íbamos hasta 48 horas antes, y fue perfecto.',
      },
      {
        author: 'Ana & Diego',
        city: 'Madrid',
        quote:
          'Randomtrip nos llevó a lugares que nunca hubiéramos descubierto por nuestra cuenta. Una aventura única.',
      },
      {
        author: 'Sofia & Miguel',
        city: 'Barcelona',
        quote:
          'La sorpresa fue total. Cada día era una nueva aventura. Definitivamente lo repetiremos.',
      },
      {
        author: 'Laura & Pablo',
        city: 'Valencia',
        quote:
          'Increíble cómo conocieron nuestros gustos sin que les dijéramos nada. El viaje fue perfecto.',
      },
      {
        author: 'Carmen & Roberto',
        city: 'Sevilla',
        quote:
          'Una experiencia única que nos unió aún más como pareja. Altamente recomendado.',
      },
      {
        author: 'Isabel & Fernando',
        city: 'Málaga',
        quote:
          'Randomtrip superó todas nuestras expectativas. Un viaje que recordaremos para siempre.',
      },
    ] as Testimonial[],
  },
};
