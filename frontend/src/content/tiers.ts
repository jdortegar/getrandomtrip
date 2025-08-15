export type Tier = {
  id: string;
  title: string;
  priceLabel: string;    // texto del precio (p.ej. “hasta US$ X”)
  highlights: string[];  // bullets
};

export const BASE_TIERS: Tier[] = [
  {
    id: 'discover',
    title: 'Discover',
    priceLabel: 'hasta US$ 900',
    highlights: [
      'Hoteles boutique seleccionados',
      'Experiencias esenciales',
      'Asistencia antes y durante el viaje',
    ],
  },
  {
    id: 'inspire',
    title: 'Inspire',
    priceLabel: 'hasta US$ 1.500',
    highlights: [
      'Alojamientos con encanto',
      'Experiencias curadas',
      'Sugerencias gastronómicas',
    ],
  },
  {
    id: 'elevate',
    title: 'Elevate',
    priceLabel: 'hasta US$ 2.500',
    highlights: [
      'Alojamientos 4*/5*',
      'Experiencias distintivas',
      'Atención prioritaria',
    ],
  },
  {
    id: 'signature',
    title: 'Signature',
    priceLabel: 'hasta US$ 4.000',
    highlights: [
      'Hoteles de autor',
      'Momentos únicos',
      'Diseño a medida',
    ],
  },
  {
    id: 'ultra',
    title: 'Ultra',
    priceLabel: 'US$ 4.000+',
    highlights: [
      'Colección de lujo',
      'Accesos exclusivos',
      'Personalización total',
    ],
  },
];
