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
        maxNights: 2,
        name: 'Essenza',
        subtitle: 'La escapada express',
        price: 350,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona',
        features: [
          { title: 'Duración', description: 'Max. 2 noches (Escapada Fugaz)' },
          { title: 'Destinos', description: 'Destinos Nacionales' },
          {
            title: 'Transporte',
            description: 'Tierra / Low Cost (Llegada práctica)',
          },
          {
            title: 'Alojamiento',
            description: 'Confort (3★) - Funcional y con onda',
          },
          {
            title: 'Beneficios',
            description: 'Guía General del Destino',
          },
        ],
        closingLine:
          'Un escape breve, suficiente para mirarse distinto y recordar por qué empezó todo.',
        ctaLabel: 'Den el primer paso',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'explora',
        maxNights: 3,
        name: 'Modo Explora',
        subtitle: 'Viaje activo y Flexible',
        price: 550,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: 'Max 3 Noches (+Mayor flexibilidad)',
          },
          {
            title: 'Destinos',
            description: 'Nacionales+ (Más lejos & Regionales)',
          },
          {
            title: 'Transporte',
            description: 'Vuelos Básicos (Mochila en mano)',
          },
          {
            title: 'Alojamiento',
            description: '+ Estilo (3-4★) - Eleva tu estancia',
          },
          {
            title: 'Beneficios',
            description:
              'Guía Randomtrip del destino, diseñada para descubrir juntos',
          },
        ],
        closingLine:
          'Para los que creen que la mejor forma de enamorarse es perderse y reencontrarse.',
        ctaLabel: 'Exploren su historia',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'exploraPlus',
        maxNights: 4,
        name: 'Explora+',
        subtitle: 'Más capas, más momentos',
        price: 850,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: 'Max 4 Noches (+Puentes & Feriados)',
          },
          {
            title: 'Destinos',
            description: '+ Continentales (Nuevas fronteras)',
          },
          {
            title: 'Transporte',
            description: 'Vuelos Clásicos (Equipaje estándar)',
          },
          {
            title: 'Alojamiento',
            description: '+ Premium (4★) - Upscale & Boutique',
          },
          {
            title: 'Beneficios',
            description:
              '1 Experiencia Incluida + Guía Destination Decoded (guía personalizada para que cada día sea una sorpresa curada)',
          },
        ],
        closingLine:
          'Más noches, más sorpresas, más excusas para coleccionar recuerdos de a dos.',
        ctaLabel: 'Suban la apuesta',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'bivouac',
        maxNights: 5,
        name: 'Bivouac',
        subtitle: 'Desconexión Total',
        price: 1200,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: 'Max 5 Noches (Sin restricciones)',
          },
          {
            title: 'Destinos',
            description: '+ Intercontinental (Destinos soñados)',
          },
          {
            title: 'Transporte',
            description: 'Vuelos Full (Máxima comodidad)',
          },
          {
            title: 'Alojamiento',
            description: '+ Upper-Scale (4-5★) - Diseño y Servicio',
          },
          {
            title: 'Beneficios',
            description:
              '1 Experiencia Exclusiva + Perks. (ej: late check-out, upgrade, amenities, etc.) + Guía Destination Decoded (guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen)',
          },
        ],
        closingLine:
          'Un viaje que se cuida como se cuida una relación: con detalle y paciencia.',
        ctaLabel: 'Viajen distinto',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'atelier',
        maxNights: 7,
        name: 'Atelier Getaway',
        subtitle: 'Amor a medida',
        price: 1200,
        priceLabel: 'Desde',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: '100% Flexible (Sin límite de días)',
          },
          { title: 'Destinos', description: 'Global (El mundo a tu alcance)' },
          {
            title: 'Transporte',
            description: 'Flex / Premium / Privado (A tu medida)',
          },
          {
            title: 'Alojamiento',
            description: 'High-End & Hoteles de Autor (Selección Curada)',
          },
          {
            title: 'Beneficios',
            description:
              'Co-creación del viaje con un Tripper Travel Advisor + equipo de soporte 24/7.',
          },
        ],
        closingLine:
          'Un lienzo en blanco para crear la escapada que nadie más podrá repetir.',
        ctaLabel: 'Creen lo irrepetible',
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
        country: 'Argentina',
        quote:
          'Fue la experiencia más increíble de nuestras vidas. No sabíamos a dónde íbamos hasta 48 horas antes, y fue perfecto.',
      },
      {
        author: 'Ana & Diego',
        country: 'Spain',
        quote:
          'Randomtrip nos llevó a lugares que nunca hubiéramos descubierto por nuestra cuenta. Una aventura única.',
      },
      {
        author: 'Sofia & Miguel',
        country: 'Spain',
        quote:
          'La sorpresa fue total. Cada día era una nueva aventura. Definitivamente lo repetiremos.',
      },
      {
        author: 'Laura & Pablo',
        country: 'Spain',
        quote:
          'Increíble cómo conocieron nuestros gustos sin que les dijéramos nada. El viaje fue perfecto.',
      },
      {
        author: 'Carmen & Roberto',
        country: 'Spain',
        quote:
          'Una experiencia única que nos unió aún más como pareja. Altamente recomendado.',
      },
      {
        author: 'Isabel & Fernando',
        country: 'Spain',
        quote:
          'Randomtrip superó todas nuestras expectativas. Un viaje que recordaremos para siempre.',
      },
    ] as Testimonial[],
  },
};
