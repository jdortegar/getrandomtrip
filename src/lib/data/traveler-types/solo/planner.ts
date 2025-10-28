import type { TypePlannerContent } from '@/types/planner';
import { soloTiers } from './tiers';
import { SOLO_EXCUSE_OPTIONS } from './excuse-options';

export const soloPlannerContent: TypePlannerContent = {
  title: 'Diseña tu Randomtrip en solitario',
  subtitle: 'Tres pasos sencillos para una aventura que solo tú podrás contar.',
  levels: soloTiers,
  excuseOptions: SOLO_EXCUSE_OPTIONS,
  steps: {
    step2Label: 'La Excusa',
    presupuesto: {
      title: '¿Cuánto querés gastar?',
      tagline:
        'Lo único que definís acá es el presupuesto para pasaje y alojamiento. Ese será tu techo. Del resto… nos ocupamos nosotros.',
      categoryLabels: [
        'Duración del viaje',
        'Destinos',
        'Transporte',
        'Alojamiento',
        'Experiencias únicas',
        'Extras',
        'Destination Decoded',
      ],
    },
    excuse: {
      title: 'Viajás por muchas razones, ¿cuál te mueve hoy?',
      tagline: 'Toda escapada tiene su "porque sí".',
      cards: [
        {
          key: 'get-lost',
          title: 'Autodescubrimiento',
          img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
          description: 'Un viaje para reconectar con vos mismo.',
        },
        {
          key: 'aventura-desafio',
          title: 'Aventura',
          img: 'https://images.unsplash.com/photo-1562337635-a4d98d22c1d2',
          description: 'Porque la adrenalina es mejor cuando la elegís vos.',
        },
      ],
    },
    details: {
      title: 'Afiná tus detalles',
      tagline: 'Elegí las opciones que te gustan para crear tu viaje.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
