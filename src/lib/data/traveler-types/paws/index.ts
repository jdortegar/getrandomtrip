import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const paws: TravelerTypeData = {
  meta: {
    slug: 'paws',
    label: 'PAWS',
    aliases: ['mascotas'],
    pageTitle: 'PAWS | Randomtrip',
  },
  content: {
    hero: {
      title: 'Paws© Randomtrip',
      subtitle:
        'Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amig@ de cuatro patas también es protagonista.',
      tagline: 'Aventuras con huella',
      scrollText: 'SCROLL',
      videoSrc: '/videos/paws-hero-video.mp4',
      fallbackImage: '/images/journey-types/paws-card.jpg',
      primaryCta: {
        text: '🐾 RANDOMTRIP-paws!',
        href: '#paws-planner',
        ariaLabel: 'Comienza tu viaje con tu mascota',
      },
    } as HeroContent,
    story: {
      title: 'Aventura con Huella',
      paragraphs: [
        'Dicen que la vida es mejor con compañía… y pocas compañías son tan leales como la que te espera al llegar a casa con un movimiento de cola o un ronroneo.',
        'En PAWS© RANDOMTRIP creemos que los viajes no deberían dejar a nadie atrás. Diseñamos escapadas donde tu mascota no es un problema logístico, sino parte esencial de la aventura.',
        'Un camino nuevo huele distinto; un bosque tiene sonidos que despiertan curiosidad; una playa es territorio para correr sin relojes. Ellos no solo te acompañan: te enseñan a viajar distinto.',
        'Porque algunas huellas se dejan en la arena, y otras, para siempre en la memoria.',
      ],
      eyebrow: 'Compañía leal',
    } as ParagraphContent,
  },
  planner: {
    title: 'Diseñen su PAWS Randomtrip',
    subtitle:
      'Tres pasos sencillos para una aventura donde tu mascota es protagonista.',
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
        excuses: getExcusesByType('paws'),
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
    title: 'Aventuras con tu mejor amigo',
    subtitle: 'Destinos y consejos para viajar con tu mascota.',
    posts: [
      {
        image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e',
        category: 'Consejos',
        title: 'Cómo viajar con tu mascota sin estrés',
      },
      {
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Destinos',
        title: 'Los mejores destinos pet-friendly',
      },
      {
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b',
        category: 'Experiencias',
        title: 'Nuestro viaje con Max por la Patagonia',
      },
      {
        image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
        category: 'Guías',
        title: 'Documentación necesaria para viajar con mascotas',
      },
      {
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Aventura',
        title: 'Trekking con perros: rutas recomendadas',
      },
      {
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Salud',
        title: 'Tips veterinarios para viajes largos',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'Ver todas las historias',
      subtitle: 'Ir al Blog',
      href: '/blogs/paws',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'Lo que dicen nuestros viajeros con mascotas',
    items: [
      {
        quote:
          'Mi perro disfrutó tanto como yo. Lugares increíbles y pet-friendly.',
        author: 'Lucía & Max',
        city: 'Buenos Aires',
      },
      {
        quote:
          'Todo estaba pensado para viajar con mascota. Sin complicaciones.',
        author: 'Pedro & Luna',
        city: 'Montevideo',
      },
      {
        quote:
          'Encontramos playas, parques y restaurantes perfectos para ir con Toby.',
        author: 'Ana & Toby',
        city: 'Santiago',
      },
      {
        quote: 'Mi gato viajó cómodo y seguro. Gran experiencia para ambos.',
        author: 'María & Michi',
        city: 'Lima',
      },
      {
        quote:
          'Actividades y alojamientos ideales para viajar con nuestro peludo.',
        author: 'Juan & Rocky',
        city: 'Córdoba',
      },
      {
        quote:
          'Un viaje que disfrutamos toda la familia, incluida nuestra mascota.',
        author: 'Familia López & Coco',
        city: 'Mendoza',
      },
    ] as Testimonial[],
  },
};
