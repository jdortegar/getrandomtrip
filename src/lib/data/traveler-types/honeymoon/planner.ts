import type { TypePlannerContent } from '@/types/planner';
import { honeymoonTiers } from './tiers';
import { HONEYMOON_EXCUSE_OPTIONS } from './excuse-options';

export const honeymoonPlannerContent: TypePlannerContent = {
  title: 'Diseñen su Honeymoon Randomtrip',
  subtitle: 'Tres pasos para comenzar su vida juntos de la mejor manera.',
  levels: honeymoonTiers,
  excuseOptions: HONEYMOON_EXCUSE_OPTIONS,
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
    excuse: {
      title: '¿Qué tipo de luna de miel sueñan?',
      tagline: 'El comienzo perfecto para su vida juntos.',
      cards: [
        {
          key: 'romantic-paradise',
          title: 'Paraíso Romántico',
          img: 'https://images.unsplash.com/photo-1519741497674-611481863552',
          description:
            'Playas paradisíacas, atardeceres inolvidables y momentos de intimidad perfecta. Hoteles boutique frente al mar, cenas privadas en la playa y experiencias diseñadas para celebrar su amor en los escenarios más románticos del mundo.',
        },
        {
          key: 'luxury-escape',
          title: 'Escapada de Lujo',
          img: 'https://images.unsplash.com/photo-1687875495230-96dfea96d9da',
          description:
            'Spa de clase mundial, cenas privadas con chef personal, suites presidenciales y el máximo confort. Tratamientos de pareja, traslados en limusina, acceso VIP a los mejores restaurantes y experiencias exclusivas que solo el lujo puede ofrecer.',
        },
        {
          key: 'adventure-honeymoon',
          title: 'Luna de Miel Aventurera',
          img: 'https://images.unsplash.com/photo-1562337635-a4d98d22c1d2',
          description:
            'Trekking por montañas, buceo en arrecifes, safaris nocturnos y experiencias que aceleran el corazón. Para parejas que buscan adrenalina, descubrimiento y aventuras que los unan a través de desafíos compartidos y recuerdos únicos.',
        },
        {
          key: 'cultural-romance',
          title: 'Romance Cultural',
          img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
          description:
            'Ciudades históricas, museos íntimos, gastronomía local y tradiciones que enriquecen el alma. Paseos por barrios antiguos, catas de vino privadas, espectáculos culturales y experiencias que conectan con la esencia de cada destino.',
        },
      ],
    },
    details: {
      title: 'Afinen los detalles',
      tagline: 'Elijan las opciones perfectas para su luna de miel.',
      ctaLabel: 'Continuar al diseño →',
    },
  },
};
