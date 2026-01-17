import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const solo: TravelerTypeData = {
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
      fallbackImage: '/images/journey-types/solo-traveler.jpg',
      secondaryCta: {
        text: 'RANDOMTRIP-ME!',
        href: '#solo-planner',
        ariaLabel: 'Ir a la sección de planificación de viaje',
      },
      primaryCta: {
        text: 'Historias inspiradoras',
        href: '#solo-blog',
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
        name: 'Essenza',
        subtitle: 'Lo esencial con estilo',
        priceLabel: 'Hasta 300 USD',
        priceFootnote: 'x por persona',
        features: [
          { title: 'Duración', description: 'Máx 2 noches' },
          { title: 'Destinos', description: 'Ciudades Nacionales' },
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
        closingLine:
          'Un escape breve para perderte en lo simple y encontrarte en lo inesperado.',
        ctaLabel: 'Elegir Essenza',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'explora',
        name: 'Modo Explora',
        subtitle: 'Aventura sin límites',
        priceLabel: 'Hasta 550 USD',
        priceFootnote: 'x por persona',
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
        ctaLabel: 'Elegir Modo Explora',
        excuses: [
          {
            key: 'solo-adventure',
            title: 'Aventura en Solitario',
            description:
              'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Aventura en Solitario',
              core: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
              ctaLabel: 'Aventúrate solo →',
              tint: 'bg-emerald-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'hiking-trekking',
                  label: 'Senderismo & Trekking',
                  desc: 'Caminar hacia lugares que solo se alcanzan a pie.',
                  img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
                },
                {
                  key: 'water-sports',
                  label: 'Deportes Acuáticos',
                  desc: 'Sumergirse en aventuras acuáticas.',
                  img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
                },
                {
                  key: 'extreme-sports',
                  label: 'Deportes Extremos',
                  desc: 'Adrenalina pura que te haga sentir vivo.',
                  img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
                },
              ],
            },
          },
          {
            key: 'cultural-immersion',
            title: 'Inmersión Cultural',
            description:
              'Sumergirse en tradiciones, sabores y costumbres locales.',
            img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
            details: {
              title: 'Inmersión Cultural',
              core: 'Sumergirse en tradiciones, sabores y costumbres locales.',
              ctaLabel: 'Sumérgete en la cultura →',
              tint: 'bg-amber-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
              options: [
                {
                  key: 'local-traditions',
                  label: 'Tradiciones Locales',
                  desc: 'Participar en ceremonias y festividades auténticas.',
                  img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
                },
                {
                  key: 'culinary-tours',
                  label: 'Tours Culinarios',
                  desc: 'Saborear la gastronomía local con chefs y familias.',
                  img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
                },
                {
                  key: 'art-galleries',
                  label: 'Arte & Galerías',
                  desc: 'Explorar el arte local y las expresiones culturales.',
                  img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
                },
              ],
            },
          },
        ],
      },
      {
        id: 'exploraPlus',
        name: 'Explora+',
        subtitle: 'Experiencia premium',
        priceLabel: 'Hasta 1000 USD',
        priceFootnote: 'x por persona',
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
        ctaLabel: 'Elegir Explora+',
        excuses: [
          {
            key: 'solo-adventure',
            title: 'Aventura en Solitario',
            description:
              'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Aventura en Solitario',
              core: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
              ctaLabel: 'Aventúrate solo →',
              tint: 'bg-emerald-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'hiking-trekking',
                  label: 'Senderismo & Trekking',
                  desc: 'Caminar hacia lugares que solo se alcanzan a pie.',
                  img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
                },
                {
                  key: 'water-sports',
                  label: 'Deportes Acuáticos',
                  desc: 'Sumergirse en aventuras acuáticas.',
                  img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
                },
                {
                  key: 'extreme-sports',
                  label: 'Deportes Extremos',
                  desc: 'Adrenalina pura que te haga sentir vivo.',
                  img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
                },
              ],
            },
          },
          {
            key: 'cultural-immersion',
            title: 'Inmersión Cultural',
            description:
              'Sumergirse en tradiciones, sabores y costumbres locales.',
            img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
            details: {
              title: 'Inmersión Cultural',
              core: 'Sumergirse en tradiciones, sabores y costumbres locales.',
              ctaLabel: 'Sumérgete en la cultura →',
              tint: 'bg-amber-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
              options: [
                {
                  key: 'local-traditions',
                  label: 'Tradiciones Locales',
                  desc: 'Participar en ceremonias y festividades auténticas.',
                  img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
                },
                {
                  key: 'culinary-tours',
                  label: 'Tours Culinarios',
                  desc: 'Saborear la gastronomía local con chefs y familias.',
                  img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
                },
                {
                  key: 'art-galleries',
                  label: 'Arte & Galerías',
                  desc: 'Explorar el arte local y las expresiones culturales.',
                  img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
                },
              ],
            },
          },
          {
            key: 'wellness-retreat',
            title: 'Retiro de Bienestar',
            description:
              'Reconectar contigo mismo en un ambiente de paz y tranquilidad.',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
            details: {
              title: 'Retiro de Bienestar',
              core: 'Reconectar contigo mismo en un ambiente de paz y tranquilidad.',
              ctaLabel: 'Reconecta contigo →',
              tint: 'bg-teal-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
              options: [
                {
                  key: 'spa-treatments',
                  label: 'Tratamientos de Spa',
                  desc: 'Relajación total con masajes y terapias.',
                  img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
                },
                {
                  key: 'meditation-yoga',
                  label: 'Meditación & Yoga',
                  desc: 'Encontrar la paz interior y el equilibrio.',
                  img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
                },
                {
                  key: 'nature-immersion',
                  label: 'Inmersión en la Naturaleza',
                  desc: 'Conectar con la naturaleza y sus ciclos.',
                  img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
                },
              ],
            },
          },
        ],
      },
      {
        id: 'bivouac',
        name: 'Bivouac',
        subtitle: 'Aventura sin límites',
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: 'x por persona',
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
        ctaLabel: 'Elegir Bivouac',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'atelier',
        name: 'Atelier Getaway',
        subtitle: 'Experiencia de lujo',
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: 'x por persona',
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
        ctaLabel: 'Elegir Atelier',
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
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
        category: 'Independencia',
        title: 'Viajar Solo: La Mejor Decisión que Puedes Tomar',
      },
      {
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        category: 'Seguridad',
        title: 'Consejos de Seguridad para Viajeros Solitarios',
      },
      {
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Destinos',
        title: 'Los Mejores Destinos para tu Primer Viaje Solo',
      },
      {
        image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3',
        category: 'Presupuesto',
        title: 'Cómo Viajar Solo Sin Gastar de Más',
      },
      {
        image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60',
        category: 'Experiencias',
        title: 'Conociendo Personas en el Camino',
      },
      {
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
        city: 'Buenos Aires',
      },
      {
        quote:
          'La sorpresa fue un regalo. Me encontré con lugares y personas que no esperaba.',
        author: 'Camila R.',
        city: 'Montevideo',
      },
      {
        quote:
          'Itinerario flexible y seguro. Pude moverme a mi ritmo sin perderme lo esencial.',
        author: 'Diego P.',
        city: 'Santiago',
      },
      {
        quote:
          'Me animé a probar cosas nuevas. Gran equilibrio entre actividad y calma.',
        author: 'Luisa G.',
        city: 'Córdoba',
      },
      {
        quote:
          'La curaduría me hizo sentir protagonista del viaje, no espectador.',
        author: 'Tomás L.',
        city: 'Mendoza',
      },
      {
        quote:
          'Descubrí que viajar solo no significa sentirse solo. Gran experiencia.',
        author: 'Paula F.',
        city: 'Lima',
      },
    ] as Testimonial[],
  },
};
