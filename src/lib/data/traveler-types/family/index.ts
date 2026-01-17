import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const family: TravelerTypeData = {
  meta: {
    slug: 'family',
    label: 'En Familia',
    aliases: ['familia', 'families'],
    pageTitle: 'En Familia | Randomtrip',
  },
  content: {
    hero: {
      title: 'Kin© Randomtrip',
      subtitle:
        'Viajar en familia es moverse, es descubrirse, es crear anécdotas que después se contarán mil veces en la sobremesa.',
      tagline: 'Escapadas diseñadas para toda la familia',
      scrollText: 'SCROLL',
      videoSrc: '/videos/family-hero-video.mp4',
      fallbackImage: '/images/journey-types/family-traveler.jpg',
      primaryCta: {
        text: 'RANDOMTRIP-we!',
        href: '#family-planner',
        ariaLabel: 'Comienza tu viaje en familia',
      },
    } as HeroContent,
    story: {
      title: 'En Familia',
      paragraphs: [
        'Una escapada en familia no empieza en la ruta, en el aeropuerto, ni en la estación, sino en la mesa de la cocina, cuando alguien dice "¿y si…?". Ese disparador sencillo, entre un plato de pasta y la discusión sobre quién lava los platos, es donde nacen las mejores aventuras.',
        'En Randomtrip sabemos que no hace falta cruzar medio mundo para sentirse lejos: basta un par de días para mirar a los tuyos de otra manera. Los más chicos convierten cualquier rincón en un parque, los adolescentes descubren que aún pueden sorprenderse, y los abuelos vuelven a reír con ganas.',
        'Diseñamos escapadas sin moldes ni guiones. Breves, intensas, llenas de momentos que se inventan paso a paso. Días que pasan volando, noches que quedan en la memoria, historias que se contarán en cada sobremesa. Porque las escapadas terminan, pero las historias quedan.',
      ],
      eyebrow: 'Historias que quedan',
    } as ParagraphContent,
  },
  planner: {
    title: 'Diseñen su Randomtrip en familia',
    subtitle:
      '3 pasos cortos, para que comencemos a crear la mejor experiencia.',
    levels: [
      {
        id: 'essenza',
        name: 'Essenza',
        subtitle: 'Lo esencial con estilo',
        priceLabel: 'Hasta 350 USD',
        priceFootnote: '· por persona',
        features: [
          {
            title: 'Duración',
            description: 'Máx 2 noches',
          },
          {
            title: 'Destinos',
            description: 'Ciudades Nacionales',
          },
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
          {
            title: 'Extras',
            description: 'Guía esencial del destino.',
          },
          {
            title: 'Beneficios',
            description: 'No incluye',
          },
        ],
        closingLine: 'Perfecto para una escapada rápida y económica.',
        ctaLabel: 'Elegir Essenza →',
        excuses: getExcusesByType('family'),
      },
      {
        id: 'explora',
        name: 'Modo Explora',
        subtitle: 'Aventura sin límites',
        priceLabel: 'Hasta 650 USD',
        priceFootnote: '· por persona',
        features: [
          {
            title: 'Duración',
            description: 'Hasta 4 noches',
          },
          {
            title: 'Destinos',
            description: 'Nacionales + Regionales',
          },
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
          {
            title: 'Beneficios',
            description: 'Soporte 24/7',
          },
        ],
        closingLine: 'Ideal para explorar más allá de lo obvio.',
        ctaLabel: 'Elegir Modo Explora →',
        excuses: [
          {
            key: 'default-excuse',
            title: 'Experiencia Estándar',
            description: 'Una experiencia completa y bien balanceada.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Experiencia Estándar',
              core: 'Una experiencia completa y bien balanceada.',
              ctaLabel: 'Continuar →',
              tint: 'bg-blue-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'standard-option',
                  label: 'Opción Estándar',
                  desc: 'Experiencia estándar incluida.',
                  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
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
        priceLabel: 'Hasta 1200 USD',
        priceFootnote: '· por persona',
        features: [
          {
            title: 'Duración',
            description: 'Hasta 7 noches',
          },
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
          {
            title: 'Alojamiento',
            description: 'Lujo (5★ o equivalentes).',
          },
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
        excuses: [
          {
            key: 'default-excuse',
            title: 'Experiencia Premium',
            description:
              'Lo mejor de lo mejor para una experiencia inolvidable.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Experiencia Premium',
              core: 'Lo mejor de lo mejor para una experiencia inolvidable.',
              ctaLabel: 'Continuar →',
              tint: 'bg-purple-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'premium-option',
                  label: 'Opción Premium',
                  desc: 'Experiencia premium incluida.',
                  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
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
        priceFootnote: '· por persona',
        features: [
          {
            title: 'Duración',
            description: 'Hasta 5 noches',
          },
          {
            title: 'Destinos',
            description: 'Toda América (sin límites)',
          },
          {
            title: 'Transporte',
            description: 'Multimodal con comodidad priorizada.',
          },
          {
            title: 'Fechas',
            description: 'Sin bloqueos.',
          },
          {
            title: 'Alojamiento',
            description: 'Upper-Upscale.',
          },
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
        excuses: [
          {
            key: 'default-excuse',
            title: 'Experiencia Premium',
            description:
              'Lo mejor de lo mejor para una experiencia inolvidable.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Experiencia Premium',
              core: 'Lo mejor de lo mejor para una experiencia inolvidable.',
              ctaLabel: 'Continuar →',
              tint: 'bg-purple-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'premium-option',
                  label: 'Opción Premium',
                  desc: 'Experiencia premium incluida.',
                  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
                },
              ],
            },
          },
        ],
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
          {
            title: 'Destinos',
            description: 'Sin límites geográficos',
          },
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
        excuses: [
          {
            key: 'default-excuse',
            title: 'Experiencia Premium',
            description:
              'Lo mejor de lo mejor para una experiencia inolvidable.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Experiencia Premium',
              core: 'Lo mejor de lo mejor para una experiencia inolvidable.',
              ctaLabel: 'Continuar →',
              tint: 'bg-purple-900/30',
              heroImg:
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'premium-option',
                  label: 'Opción Premium',
                  desc: 'Experiencia premium incluida.',
                  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
                },
              ],
            },
          },
        ],
      },
    ],
  } as TypePlannerContent,
  blog: {
    title: 'Nuestros destinos favoritos para viajar en familia',
    subtitle: 'Historias, destinos y gatillos creativos para elegir mejor.',
    posts: [
      {
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        category: 'Inspiración',
        title: 'Explora las historias de nuestros Trippers',
      },
      {
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Consejos',
        title: 'Nuestros lugares favoritos para toda la familia',
      },
      {
        image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
        category: 'Experiencias',
        title: 'Ideas para distintas edades y estilos',
      },
      {
        image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
        category: 'Guías',
        title: 'Cómo planificar un finde familiar sin estrés',
      },
      {
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Aventura',
        title: 'Naturaleza cerca de casa: 5 escapadas',
      },
      {
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Cultura',
        title: 'Fiestas locales para ir con chicos',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'Ver todas las historias',
      subtitle: 'Ir al Blog',
      href: '/blogs/families',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'Lo que dicen nuestras familias',
    items: [
      {
        quote:
          'Todos disfrutaron, desde el más chico hasta los abuelos. Muy bien balanceado.',
        author: 'Familia Gómez',
        city: 'Rosario',
      },
      {
        quote:
          'Actividades para todas las edades. Se nota que pensaron en cada detalle.',
        author: 'Familia López',
        city: 'Córdoba',
      },
      {
        quote:
          'Los chicos querían quedarse un día más. Hermosos recuerdos para todos.',
        author: 'Familia Fernández',
        city: 'Buenos Aires',
      },
      {
        quote:
          'Flexibilidad sin perder estructura. Fue fácil movernos con los nenes.',
        author: 'Familia Martínez',
        city: 'Mendoza',
      },
      {
        quote:
          'Un viaje del que todavía hablamos en las cenas. Vale cada peso.',
        author: 'Familia Silva',
        city: 'Santiago',
      },
      {
        quote:
          'Descubrimos lugares que no hubiéramos encontrado solos. Gran experiencia.',
        author: 'Familia Rodríguez',
        city: 'Lima',
      },
    ] as Testimonial[],
  },
};
