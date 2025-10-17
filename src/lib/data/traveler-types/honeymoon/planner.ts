import type { TypePlannerContent } from '@/types/planner';
import { honeymoonTiers } from './tiers';
import { HONEYMOON_ALMA_OPTIONS } from './alma-options';

export const honeymoonPlannerContent: TypePlannerContent = {
  title: 'Diseñen su Honeymoon Randomtrip',
  subtitle: 'Tres pasos para comenzar su vida juntos de la mejor manera.',
  tiers: honeymoonTiers,
  almaOptions: HONEYMOON_ALMA_OPTIONS,
  steps: {
    step2Label: 'La Excusa',
    presupuesto: {
      title: '¿Cuánto quieren invertir en su luna de miel?',
      tagline:
        'Definan el presupuesto por persona para pasaje y alojamiento. Este es el inicio de su aventura juntos.',
      categoryLabels: [
        'Duración del viaje',
        'Destinos románticos',
        'Transporte',
        'Alojamiento especial',
        'Experiencias únicas',
        'Extras románticos',
        'Destination Decoded',
      ],
    },
    laExcusa: {
      title: '¿Qué tipo de luna de miel sueñan?',
      tagline: 'El comienzo perfecto para su vida juntos.',
      cards: [
        {
          key: 'romantic-paradise',
          title: 'Paraíso Romántico',
          img: 'https://images.unsplash.com/photo-1519741497674-611481863552',
          description:
            'Playas paradisíacas y atardeceres inolvidables para celebrar su amor.',
        },
        {
          key: 'luxury-escape',
          title: 'Escapada de Lujo',
          img: 'https://images.unsplash.com/photo-1687875495230-96dfea96d9da',
          description:
            'Spa, cenas privadas y el máximo confort para su luna de miel.',
        },
        {
          key: 'adventure-honeymoon',
          title: 'Luna de Miel Aventurera',
          img: 'https://images.unsplash.com/photo-1562337635-a4d98d22c1d2',
          description:
            'Para parejas que buscan adrenalina y experiencias únicas juntos.',
        },
        {
          key: 'cultural-romance',
          title: 'Romance Cultural',
          img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
          description:
            'Ciudades históricas, arte y gastronomía para su viaje romántico.',
        },
      ],
    },
    afinarDetalles: {
      title: 'Afinen los detalles',
      tagline: 'Elijan las opciones perfectas para su luna de miel.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
