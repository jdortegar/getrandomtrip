import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const honeymoon: TravelerTypeData = {
  meta: {
    slug: 'honeymoon',
    label: 'Luna de Miel',
    aliases: ['luna-de-miel'],
    pageTitle: 'Luna de Miel | Randomtrip',
  },
  content: {
    hero: {
      title: 'Nuptia© Randomtrip',
      subtitle:
        'La luna de miel no es un destino, es el primer capítulo de su vida juntos. Nosotros diseñamos la sorpresa; ustedes se encargan de vivirla.',
      tagline: 'El comienzo de una historia única',
      scrollText: 'SCROLL',
      videoSrc: '/videos/honeymoon-video.mp4',
      fallbackImage: '/images/journey-types/honeymoon-same-sex.jpg',
      primaryCta: {
        text: 'RANDOMTRIP-us!',
        href: '#honeymoon-planner',
        ariaLabel: 'Comienza tu luna de miel',
      },
    } as HeroContent,
    story: {
      title: 'El comienzo invisible que nadie más verá',
      paragraphs: [
        'El casamiento fue apenas un rito, un momento donde el amor se hizo público. Pero la luna de miel… la luna de miel es el instante privado en el que dos miradas se buscan sin testigos.',
        'No hay coordenadas precisas para ese viaje. Porque lo que importa no es el lugar al que se llega, sino lo que cada paso revela del otro. Una risa inesperada en medio de una caminata, un silencio compartido frente al mar, la certeza de que hay alguien que nos acompaña incluso cuando no decimos nada.',
        'Nosotros proponemos el escenario, ustedes escribirán el guion invisible que nadie más podrá repetir. Porque hay viajes que se terminan al regresar, y otros —los verdaderos— que empiezan cuando entendemos que el destino es, en realidad, el vínculo que construimos cada día. La luna de miel no es el epílogo de una fiesta. Es el prólogo de una historia que recién comienza.',
      ],
      eyebrow: 'El primer capítulo',
    } as ParagraphContent,
  },
  planner: {
    title: 'Diseñen su Honeymoon Randomtrip',
    subtitle: 'Tres pasos para comenzar su vida juntos de la mejor manera.',
    levels: [
      {
        id: 'essenza',
        name: 'Essenza',
        subtitle: 'Lo esencial con estilo',
        priceLabel: 'Hasta 350 USD',
        priceFootnote: 'por persona',
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
        excuses: getExcusesByType('honeymoon'),
      },
      {
        id: 'explora',
        name: 'Modo Explora',
        subtitle: 'Aventura sin límites',
        priceLabel: 'Hasta 650 USD',
        priceFootnote: 'por persona',
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
        priceFootnote: 'por persona',
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
        priceFootnote: 'por persona',
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
        subtitle: 'Amor a medida',
        priceLabel: 'Desde 1800 USD',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: '100% Flexible (Sin límite de días)',
          },
          {
            title: 'Destinos',
            description: 'Global (El mundo a su alcance)',
          },
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
          'Un viaje irrepetible, diseñado como prólogo de una historia que recién comienza',
        ctaLabel: 'Crear lo extraordinario →',
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
    title: 'Historias de lunas de miel inolvidables',
    subtitle: 'El comienzo perfecto para su vida juntos.',
    posts: [
      {
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552',
        category: 'Romance',
        title: 'Los destinos más románticos para luna de miel',
      },
      {
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Consejos',
        title: 'Cómo planificar la luna de miel perfecta',
      },
      {
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
        category: 'Experiencias',
        title: 'Nuestra luna de miel sorpresa en la Toscana',
      },
      {
        image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
        category: 'Guías',
        title: 'Actividades románticas para recién casados',
      },
      {
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Aventura',
        title: 'Luna de miel con adrenalina',
      },
      {
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Cultura',
        title: 'Experiencias únicas para comenzar juntos',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'Ver todas las historias',
      subtitle: 'Ir al Blog',
      href: '/blogs/honeymoon',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'Lo que dicen nuestras parejas recién casadas',
    items: [
      {
        quote:
          'La luna de miel perfecta. Todo fue mágico desde el primer momento.',
        author: 'María & Juan',
        city: 'Buenos Aires',
      },
      {
        quote: 'Cada detalle pensado para nosotros. Inolvidable.',
        author: 'Laura & Pablo',
        city: 'Madrid',
      },
      {
        quote:
          'Superó nuestras expectativas. Comenzamos nuestra vida juntos de la mejor manera.',
        author: 'Ana & Diego',
        city: 'Barcelona',
      },
      {
        quote: 'Romántico, sorprendente y perfecto. Gracias por tanto.',
        author: 'Sofia & Miguel',
        city: 'Valencia',
      },
      {
        quote: 'Un comienzo de matrimonio que jamás olvidaremos.',
        author: 'Carmen & Roberto',
        city: 'Sevilla',
      },
      {
        quote: 'La experiencia más romántica que hemos vivido juntos.',
        author: 'Isabel & Fernando',
        city: 'Málaga',
      },
    ] as Testimonial[],
  },
};
