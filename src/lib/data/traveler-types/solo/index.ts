import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';
import type { Locale } from '@/lib/i18n/config';
import { soloEn } from './en';

const soloEs: TravelerTypeData = {
  meta: {
    slug: 'solo',
    label: 'Solo',
    aliases: [],
    pageTitle: 'Solo | Randomtrip',
  },
  content: {
    hero: {
      title: 'SOLUM© RANDOMTRIP',
      subtitle:
        'Tu viaje, tus reglas. Descubre destinos únicos diseñados para la libertad de viajar solo.',
      tagline: 'Aventura personal. Sin compromisos.',
      scrollText: 'SCROLL',
      videoSrc: '/videos/hero-solo-video.mp4',
      fallbackImage: '/images/fallbacks/hero-solo-video.jpg',
      secondaryCta: {
        text: 'RANDOMTRIP-ME!',
        href: '#type-planner',
        ariaLabel: 'Ir a la sección de planificación de viaje',
      },
      primaryCta: {
        text: 'Historias inspiradoras',
        href: '#blog',
        ariaLabel: 'Ir a la sección de blog',
      },
    } as HeroContent,
    story: {
      title: 'Libertad en estado puro',
      paragraphs: [
        'Cuando uno viaja solo, no hay que rendir cuentas: ni a la pareja que quiere parar en cada mirador, ni al amigo que arma itinerarios con colores.',
        'Acá no habrá listas de "cosas que hacer", ni reseñas de TripAdvisor con cinco estrellas y fotos pixeladas. Habrá un camino que se abre frente a vos, como si lo fueras inventando con cada paso. Y, en el fondo, alguien —nosotros— asegurándonos de que todo funcione aunque parezca improvisado.',
        'Quizá amanezcas mirando un lago que no sabías que existía. O termines hablando con extraños que, al rato, ya no lo serán. Viajar solo es ese raro lujo: el de encontrarte con el silencio y descubrir que no asusta tanto.',
        'Lo que empieza es un relato sin testigos: un café que se enfría mientras escribís en una libreta, una caminata que te obliga a pensar distinto, una foto que no tenés a quién mostrar pero que igual guardás.',
        'Lo único seguro es que vas a volver distinto. No mejor ni peor: distinto. Y con ganas de repetir, como ese libro que releés sabiendo que la segunda vez lo vas a entender mejor.',
      ],
      eyebrow: 'Solo, pero nunca solo',
    } as ParagraphContent,
  },
  planner: {
    eyebrow: 'Diseña tu Randomtrip en solitario',
    title: 'tres pasos sencillos',
    subtitle: 'para una aventura que solo tú podrás contar.',
    levels: [
      {
        id: 'essenza',
        maxNights: 2,
        name: 'Essenza',
        subtitle: 'Lo esencial con estilo',
        price: 450,
        priceLabel: '',
        priceFootnote: 'por persona',
        features: [
          { title: 'Duración', description: '2 noches (Escapada Fugaz)' },
          { title: 'Destinos', description: 'Ciudades Nacionales' },
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
            description: 'Guía esencial para moverte sin complicaciones.',
          },
        ],
        closingLine:
          'Un escape breve para perderte en lo simple y encontrarte en lo inesperado.',
        ctaLabel: 'Arranca tu Essenza',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'explora',
        maxNights: 3,
        name: 'Modo Explora',
        subtitle: 'Activo y Flexible',
        price: 650,
        priceLabel: '',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: '3 Noches (+Mayor flexibilidad)',
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
            description: 'Guía Randomtrip diseñada para descubrir a tu ritmo.',
          },
        ],
        closingLine:
          'Diseñado para quienes viajan livianos y quieren descubrir sin guion.',
        ctaLabel: 'Activa tu Modo Explora',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'exploraPlus',
        maxNights: 4,
        name: 'Explora+',
        subtitle: 'Más capas, más momentos',
        price: 1100,
        priceLabel: '',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: '4 Noches (+Puentes & Feriados)',
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
            description: '+Premium (4★) - Upscale & Boutique',
          },
          {
            title: 'Beneficios',
            description:
              '1 experiencia curada en solitario + Guía Destination Decoded, para que cada día sea una sorpresa curada.',
          },
        ],
        closingLine:
          'Más noches, más encuentros inesperados y más razones para volver distinto.',
        ctaLabel: 'Sube de nivel',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'bivouac',
        maxNights: 5,
        name: 'Bivouac',
        subtitle: 'Desconexión Total',
        price: 1550,
        priceLabel: '',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: '5 Noches (Sin restricciones)',
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
            description: '+Upper-Scale (4-5★) - Diseño y Servicio',
          },
          {
            title: 'Beneficios',
            description:
              '1 Experiencia Premium + Perks Exclusivos. (ej: late check-out, upgrade, amenities, etc.) + Guía Destination Decoded, curada por nuestros Trippers Travel Advisors, con claves que pocos conocen.',
          },
        ],
        closingLine:
          'Un viaje íntimo, cuidado al detalle, que convierte la soledad en un lujo personal.',
        ctaLabel: 'Viaja distinto',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'atelier',
        maxNights: 7,
        name: 'Atelier Getaway',
        subtitle: 'Distinción, sin esfuerzo',
        price: 1550,
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
        ctaLabel: 'Crea lo irrepetible',
        excuses: getExcusesByType('solo'),
      },
    ],
  } as TypePlannerContent,
  blog: {
    title: 'Nuestros destinos favoritos para viajar solo',
    subtitle:
      'El camino en solitario no significa estar solo. Estas historias y destinos te muestran que perderte también es otra forma de encontrarte.',
    posts: [
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
        category: 'Independencia',
        title: 'Viajar Solo: La Mejor Decisión que Puedes Tomar',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        category: 'Seguridad',
        title: 'Consejos de Seguridad para Viajeros Solitarios',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Destinos',
        title: 'Los Mejores Destinos para tu Primer Viaje Solo',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3',
        category: 'Presupuesto',
        title: 'Cómo Viajar Solo Sin Gastar de Más',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60',
        category: 'Experiencias',
        title: 'Conociendo Personas en el Camino',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
        category: 'Inspiración',
        title: 'El Arte de Viajar en Solitario',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'Ver todas las historias',
      subtitle: 'Más aventuras en solitario',
      href: '/blog/solo',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'Lo que dicen nuestros viajeros solitarios',
    items: [
      {
        quote:
          'Mi primer viaje solo y me sentí acompañado por una organización impecable. Volví distinto.',
        author: 'Martín S.',
        country: 'Argentina',
      },
      {
        quote:
          'La sorpresa fue un regalo. Me encontré con lugares y personas que no esperaba.',
        author: 'Camila R.',
        country: 'Uruguay',
      },
      {
        quote:
          'Itinerario flexible y seguro. Pude moverme a mi ritmo sin perderme lo esencial.',
        author: 'Diego P.',
        country: 'Chile',
      },
      {
        quote:
          'Me animé a probar cosas nuevas. Gran equilibrio entre actividad y calma.',
        author: 'Luisa G.',
        country: 'Argentina',
      },
      {
        quote:
          'La curaduría me hizo sentir protagonista del viaje, no espectador.',
        author: 'Tomás L.',
        country: 'Argentina',
      },
      {
        quote:
          'Descubrí que viajar solo no significa sentirse solo. Gran experiencia.',
        author: 'Paula F.',
        country: 'Peru',
      },
    ] as Testimonial[],
  },
};

export const solo: Record<Locale, TravelerTypeData> = {
  en: soloEn,
  es: soloEs,
};
