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
        subtitle: 'La escapada express',
        price: 490,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona \n+ mascota',
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
            description: 'Confort (3★) - Funcional y con onda pet-friendly',
          },
          {
            title: 'Beneficios',
            description: 'Guía esencial con mapa pet-friendly',
          },
        ],
        closingLine:
          'Un escape simple, donde tu mascota no es un extra, sino parte del plan.',
        ctaLabel: 'Empiecen con lo basico',
        excuses: getExcusesByType('paws'),
      },
      {
        id: 'explora',
        name: 'Modo Explora',
        subtitle: 'Viaje activo y Flexible',
        price: 770,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona \n+ mascota',
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
            description: '+ Estilo (3-4★) - Eleva tu estancia, pet-friendly',
          },
          {
            title: 'Beneficios',
            description:
              'Guía General + Tips, con rutas, spots de juego y actividades pet-friendly.',
          },
        ],
        closingLine:
          'Senderos y rincones pensados para descubrir junto a tu compañer@, con libertad y sin estrés.',
        ctaLabel: 'Exploren a 4 patas',
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
        price: 1190,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona \n+ mascota',
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
            description: '+ Premium (4★) - Upscale & Boutique, pet-friendly',
          },
          {
            title: 'Beneficios',
            description:
              '1 Experiencia Incluida (ej.: trail o day trip pet-friendly) + Guía Destination Decoded',
          },
        ],
        closingLine:
          'Más días, más juegos, más huellas en la arena y en la memoria.',
        ctaLabel: 'Suban la aventura',
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
        price: 1680,
        priceLabel: 'Hasta',
        priceFootnote: 'por persona \n+ mascota',
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
            description:
              '+ Upper-Scale (4-5★) - Diseño y Servicio, pet-friendly',
          },
          {
            title: 'Beneficios',
            description:
              '1 Experiencia Exclusiva + Perks. (ej: late check-out, upgrade, amenities, etc.) + Guía Destination Decoded (guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen)',
          },
        ],
        closingLine:
          'Un viaje premium, curado al detalle para vos y tu compañero de cuatro patas.',
        ctaLabel: 'Viaje con huellas',
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
        subtitle: 'Tu Tripper Advisor personal',
        price: 1680,
        priceLabel: 'Desde',
        priceFootnote: 'por persona \n+ mascota',
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
          'Una experiencia exclusiva donde cada momento está diseñado para ambos.',
        ctaLabel: 'Creen lo extraordinario',
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
