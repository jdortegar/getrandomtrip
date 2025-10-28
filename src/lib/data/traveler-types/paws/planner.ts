import type { TypePlannerContent } from '@/types/planner';
import { pawsTiers } from './tiers';
import { PAWS_EXCUSE_OPTIONS } from './excuse-options';

export const pawsPlannerContent: TypePlannerContent = {
  title: 'Diseñen su PAWS Randomtrip',
  subtitle:
    'Tres pasos sencillos para una aventura donde tu mascota es protagonista.',
  levels: pawsTiers,
  excuseOptions: PAWS_EXCUSE_OPTIONS,
  steps: {
    step2Label: 'La Excusa',
    presupuesto: {
      title: '¿Cuánto querés invertir?',
      tagline:
        'Definí el presupuesto para un viaje pet-friendly inolvidable. Incluye todo lo necesario para vos y tu mascota.',
      categoryLabels: [
        'Duración del viaje',
        'Destinos pet-friendly',
        'Transporte apto mascotas',
        'Alojamiento pet-friendly',
        'Experiencias con mascotas',
        'Extras',
        'Destination Decoded',
      ],
    },
    excuse: {
      title: 'Viajás con tu mascota por muchas razones, ¿cuál te mueve hoy?',
      tagline: 'Toda aventura es mejor cuando la compartís con tu mejor amigo.',
      cards: [
        {
          key: 'trails-nature',
          title: 'Naturaleza & Patas',
          img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b',
          description:
            'Senderos, playas y espacios abiertos para que tu mascota disfrute.',
        },
        {
          key: 'pet-lover-cities',
          title: 'Ciudades Pet-Friendly',
          img: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e',
          description:
            'Destinos urbanos con la mejor infraestructura para mascotas.',
        },
        {
          key: 'outdoor-adventure',
          title: 'Camping & Aventura',
          img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d',
          description:
            'Experiencias al aire libre perfectas para compartir con tu peludo.',
        },
        {
          key: 'dog-friendly-beaches',
          title: 'Retiro Playero',
          img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
          description:
            'Playas dog-friendly donde tu mascota puede correr libre.',
        },
      ],
    },
    details: {
      title: 'Afiná los detalles',
      tagline: 'Elegí las opciones ideales para vos y tu mascota.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
