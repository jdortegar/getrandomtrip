import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const group: TravelerTypeData = {
  meta: {
    slug: 'group',
    label: 'Entre Amigos',
    aliases: ['grupo', 'amigos'],
    pageTitle: 'Entre Amigos | Randomtrip',
  },
  content: {
    hero: {
      title: 'CREW© RANDOMTRIP',
      subtitle:
        'Equipos, amigos, intereses en común: diseñamos escapadas que funcionan para todos.',
      tagline: 'Los mejores momentos se viven en plural',
      scrollText: 'SCROLL',
      videoSrc: '/videos/group-hero-video.mp4',
      fallbackImage: '/images/journey-types/friends-group.jpg',
      primaryCta: {
        text: 'RANDOMTRIP-all!',
        href: '#group-planner',
        ariaLabel: 'Comienza tu viaje en grupo',
      },
    } as HeroContent,
    story: {
      title: 'Momentos en Plural',
      paragraphs: [
        'Los mejores recuerdos no se cuentan solos. Se construyen entre miradas, brindis y carcajadas que rebotan de un lado a otro. Porque los momentos, cuando se viven en grupo, pesan más. Tienen gravedad propia.',
        'Acá no se trata de coordinar vuelos ni de discutir destinos. Se trata de entregarse a la sorpresa de estar juntos, sin que nadie tenga que hacer de organizador. Ustedes llegan con la historia; nosotros la convertimos en escenario.',
        'Será una sobremesa que se extiende hasta la madrugada, una caminata que se transforma en ritual, un viaje que se volverá leyenda compartida. Porque lo que empieza en plural, siempre se recuerda en mayúsculas.',
      ],
      eyebrow: 'Compañía perfecta',
    } as ParagraphContent,
  },
  planner: {
    title: 'De amigos a equipos: diseñen su Randomtrip',
    subtitle: 'Pasos cortos, para crear la mejor experiencia grupal.',
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
        excuses: getExcusesByType('group'),
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
    title: 'Historias de viajes en grupo',
    subtitle: 'Aventuras compartidas que se convierten en leyendas.',
    posts: [
      {
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        category: 'Historias',
        title: '10 momentos que solo pasan viajando en grupo',
      },
      {
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Consejos',
        title: 'Cómo organizar un viaje con amigos sin drama',
      },
      {
        image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
        category: 'Experiencias',
        title: 'La ruta del vino que hicimos entre 8',
      },
      {
        image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
        category: 'Guías',
        title: 'Destinos ideales para grupos grandes',
      },
      {
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Aventura',
        title: 'Trekking en grupo: tips y risas',
      },
      {
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Cultura',
        title: 'Festivales para ir con la barra',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'Ver todas las historias',
      subtitle: 'Ir al Blog',
      href: '/blogs/group',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'Lo que dicen nuestros grupos',
    items: [
      {
        quote:
          'Organizaron todo perfecto para nuestro grupo de 10. Cero conflictos, pura diversión.',
        author: 'Grupo de Amigos BA',
        city: 'Buenos Aires',
      },
      {
        quote:
          'Cada uno pudo hacer lo suyo sin perderse lo grupal. Gran balance.',
        author: 'Los Viajeros',
        city: 'Montevideo',
      },
      {
        quote:
          'Actividades para todos los gustos. Nadie se aburrió ni un segundo.',
        author: 'Barra del Sur',
        city: 'Córdoba',
      },
      {
        quote:
          'La logística fue impecable. Pudimos disfrutar sin preocuparnos.',
        author: 'Crew Mendoza',
        city: 'Mendoza',
      },
      {
        quote: 'Un viaje que fortaleció nuestra amistad. Inolvidable.',
        author: 'Los Exploradores',
        city: 'Santiago',
      },
      {
        quote:
          'Sorpresas perfectamente calibradas para el grupo. Muy recomendable.',
        author: 'Squad Lima',
        city: 'Lima',
      },
    ] as Testimonial[],
  },
};
