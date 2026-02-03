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
        subtitle: 'La escapada express',
        price: 350,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: 'Max. 2 noches (Escapada Fugaz)',
          },
          {
            title: 'Destinos',
            description: 'Ciudades Nacionales',
          },
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
            description:
              'Guía esencial para que todos disfruten sin complicaciones.',
          },
        ],
        closingLine:
          'Una escapada familiar con lo esencial, sin estrés, para que todos disfruten.',
        ctaLabel: 'Reserven facil',
        excuses: getExcusesByType('family'),
      },
      {
        id: 'explora',
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
            description: 'Nacionales + (Más lejos & Regionales)',
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
              'Guía Randomtrip con actividades para todas las edades.',
          },
        ],
        closingLine:
          'Para familias que quieren explorar a su ritmo, con la flexibilidad que necesitan.',
        ctaLabel: 'Activen su Modo Explora',
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
              '1 experiencia curada familiar + Guía Destination Decoded (guía personalizada para que cada día sea una sorpresa curada)',
          },
        ],
        closingLine:
          'Más días, más actividades, más recuerdos imborrables para toda la familia.',
        ctaLabel: 'Suban el nivel',
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
          'Una experiencia familiar única, con detalles que marcan la diferencia.',
        ctaLabel: 'Viajen distinto',
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
        subtitle: 'Experiencia a medida',
        price: 1200,
        priceLabel: 'Desde',
        priceFootnote: 'por persona',
        features: [
          {
            title: 'Duración',
            description: '100% Flexible (Sin límite de días)',
          },
          {
            title: 'Destinos',
            description: 'Global (El mundo a tu alcance)',
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
          'Una experiencia a medida donde la familia entera viaja como protagonista.',
        ctaLabel: 'A un clic de lo inolvidable',
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
        country: 'Argentina',
      },
      {
        quote:
          'Actividades para todas las edades. Se nota que pensaron en cada detalle.',
        author: 'Familia López',
        country: 'Argentina',
      },
      {
        quote:
          'Los chicos querían quedarse un día más. Hermosos recuerdos para todos.',
        author: 'Familia Fernández',
        country: 'Argentina',
      },
      {
        quote:
          'Flexibilidad sin perder estructura. Fue fácil movernos con los nenes.',
        author: 'Familia Martínez',
        country: 'Argentina',
      },
      {
        quote:
          'Un viaje del que todavía hablamos en las cenas. Vale cada peso.',
        author: 'Familia Silva',
        country: 'Chile',
      },
      {
        quote:
          'Descubrimos lugares que no hubiéramos encontrado solos. Gran experiencia.',
        author: 'Familia Rodríguez',
        country: 'Peru',
      },
    ] as Testimonial[],
  },
};
