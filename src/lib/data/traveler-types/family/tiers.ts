import type { Tier } from '@/types/planner';

export const familyTiers: Tier[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    subtitle: 'Lo esencial con estilo',
    priceLabel: 'Hasta 350 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Máx 2 noches' },
      {
        label: 'Transporte',
        text: 'Low cost (buses o vuelos off-peak).',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Menor disponibilidad, con restricciones y bloqueos.',
      },
      { label: 'Alojamiento', text: 'Midscale (3★ o equivalentes).' },
      {
        label: 'Extras',
        text: 'Guía esencial para que todos disfruten sin complicaciones.',
      },
    ],
    closingLine:
      'Una escapada familiar con lo esencial, sin estrés, para que todos disfruten.',
    ctaLabel: 'Reserven fácil →',
  },
  {
    id: 'explora',
    name: 'Modo Explora',
    subtitle: 'Viaje activo y flexible',
    priceLabel: 'Hasta 500 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 3 noches' },
      {
        label: 'Transporte',
        text: 'Multimodal, horarios flexibles.',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      },
      { label: 'Alojamiento', text: 'Midscale – Upper Midscale' },
      {
        label: 'Extras',
        text: 'Guía Randomtrip con actividades para todas las edades.',
      },
    ],
    closingLine:
      'Para familias que quieren explorar a su ritmo, con la flexibilidad que necesitan.',
    ctaLabel: 'Activen su Modo Explora →',
  },
  {
    id: 'exploraPlus',
    name: 'Explora+',
    subtitle: 'Más capas, más descubrimientos',
    priceLabel: 'Hasta 850 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 4 noches' },
      {
        label: 'Transporte',
        text: 'Multimodal.',
        footnote:
          'Carry-on incluido; selección de asiento y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Alta disponibilidad, incluso en feriados/puentes.',
      },
      { label: 'Alojamiento', text: 'Upscale asegurado.' },
      { label: 'Extras', text: '1 experiencia curada familiar.' },
      {
        label: 'Destination Decoded',
        text: 'Guía personalizada para que cada día sea una sorpresa curada.',
      },
    ],
    closingLine:
      'Más días, más actividades, más recuerdos imborrables para toda la familia.',
    ctaLabel: 'Suban de nivel →',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Curaduría artesanal',
    priceLabel: 'Hasta 1200 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 5 noches' },
      {
        label: 'Transporte',
        text: 'Multimodal.',
        footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
      },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Upper-Upscale (boutique, diseño, experiencias locales).',
      },
      {
        label: 'Extras',
        text: 'Concierge Advisor + 1 experiencia premium familiar + perks.',
      },
      {
        label: 'Destination Decoded',
        text: 'Guía curada por nuestros Concierge Advisors, con claves que pocos conocen.',
      },
    ],
    closingLine:
      'Una experiencia familiar única, con detalles que marcan la diferencia.',
    ctaLabel: 'Viajen distinto →',
  },
  {
    id: 'atelier',
    name: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo',
    priceLabel: 'Desde 1200 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Customizable.' },
      { label: 'Transporte', text: 'Multimodal / a medida.' },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Luxury / de autor / Cadenas Hoteleras A1.',
      },
      {
        label: 'Extras',
        text: 'Co-creación con un Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.',
      },
    ],
    closingLine:
      'Una experiencia a medida donde la familia entera viaja como protagonista.',
    ctaLabel: 'A un clic de lo inolvidable →',
  },
];
