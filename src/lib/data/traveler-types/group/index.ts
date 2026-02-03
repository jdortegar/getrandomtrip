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
        subtitle: 'Lo esencial, compartido',
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
              'Guía esencial con recomendaciones simples para el grupo.',
          },
        ],
        closingLine:
          'Una escapada simple para sincronizar agendas, para que solo se preocupen por disfrutar juntos.',
        ctaLabel: 'Activen su Essenza',
        excuses: getExcusesByType('group'),
      },
      {
        id: 'explora',
        name: 'Modo Explora',
        subtitle: 'Activo y flexible, en equipo',
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
              'Guia Randomtrip con actividades y sugerencias para distintos ritmos dentro del grupo.',
          },
        ],
        closingLine:
          'Para grupos que quieren explorar a su ritmo, con la flexibilidad que necesitan.',
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
              '1 experiencia curada especial para el grupo (ej.: brindis privado, caminata guiada al atardecer). + Guía Destination Decoded (guía personalizada para que cada día sea una sorpresa curada)',
          },
        ],
        closingLine:
          'Más días, más actividades, más anécdotas que se vuelven leyenda compartida.',
        ctaLabel: 'Suban de nivel',
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
              '1 experiencia premium grupal (ej.: mesa del chef, excursión privada) + perks. (ej: late check-out, upgrade, amenities, etc.) + Guía Destination Decoded (guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen)',
          },
        ],
        closingLine:
          'Una experiencia grupal única, con detalles que marcan la diferencia.',
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
        subtitle: 'Distinción, a medida\n\n (Group Edition)',
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
          'La experiencia que convierte cualquier celebración en inolvidable.',
        ctaLabel: 'A un clic de lo extraordinario',
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
        country: 'Argentina',
      },
      {
        quote:
          'Cada uno pudo hacer lo suyo sin perderse lo grupal. Gran balance.',
        author: 'Los Viajeros',
        country: 'Uruguay',
      },
      {
        quote:
          'Actividades para todos los gustos. Nadie se aburrió ni un segundo.',
        author: 'Barra del Sur',
        country: 'Argentina',
      },
      {
        quote:
          'La logística fue impecable. Pudimos disfrutar sin preocuparnos.',
        author: 'Crew Mendoza',
        country: 'Argentina',
      },
      {
        quote: 'Un viaje que fortaleció nuestra amistad. Inolvidable.',
        author: 'Los Exploradores',
        country: 'Chile',
      },
      {
        quote:
          'Sorpresas perfectamente calibradas para el grupo. Muy recomendable.',
        author: 'Squad Lima',
        country: 'Peru',
      },
    ] as Testimonial[],
  },
};
