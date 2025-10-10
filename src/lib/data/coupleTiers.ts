export interface TierFeature {
  label: string;
  text: string;
  footnote?: string;
}

export interface CoupleTier {
  id: string;
  name: string;
  subtitle: string;
  priceLabel: string;
  priceFootnote: string;
  features: TierFeature[];
  closingLine: string;
  ctaLabel: string;
}

export const coupleTiers: CoupleTier[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    subtitle: 'Lo esencial con estilo',
    priceLabel: 'Hasta 350 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Máx 2 noches' },
      { label: 'Destinos', text: 'Ciudades Nacionales' },
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
        text: 'Guía esencial del destino.',
      },
      {
        label: 'Beneficios',
        text: 'No incluye',
      },
    ],
    closingLine:
      'Un escape breve, suficiente para mirarse distinto y recordar por qué empezó todo.',
    ctaLabel: 'Den el primer paso →',
  },
  {
    id: 'modo-explora',
    name: 'Modo Explora',
    subtitle: 'Viaje activo y flexible',
    priceLabel: 'Hasta 550 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 3 noches' },
      { label: 'Destinos', text: 'Ciudades Nacionales y Limitrofes' },
      {
        label: 'Transporte',
        text: 'Multimodal, horarios flexibles.',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      },
      { label: 'Alojamiento', text: 'Mid-to-Upscale.' },
      {
        label: 'Extras',
        text: 'Guía Randomtrip diseñada para descubrir juntos.',
      },
      {
        label: 'Beneficios',
        text: 'No incluye',
      },
    ],
    closingLine:
      'Para los que creen que la mejor forma de enamorarse es perderse y reencontrarse.',
    ctaLabel: 'Exploren su historia →',
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    subtitle: 'Más capas, más momentos',
    priceLabel: 'Hasta 850 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 4 noches' },
      {
        label: 'Destinos',
        text: 'Ciudades Nacionales, Limitrofes y Regionales',
      },
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
      { label: 'Extras', text: '1 experiencia especial en pareja.' },
      {
        label: 'Destination Decoded',
        text: 'Guia personalizada para que cada día sea una sorpresa curada.',
      },
    ],
    closingLine:
      'Más noches, más sorpresas, más excusas para coleccionar recuerdos a dos voces.',
    ctaLabel: 'Suban la apuesta →',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Romance artesanal',
    priceLabel: 'Hasta 1200 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 5 noches' },
      {
        label: 'Destinos',
        text: 'Todo el continente',
      },
      {
        label: 'Transporte',
        text: 'Multimodal.',
        footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
      },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Upper Upscale (boutique, diseño, experiencias locales).',
      },
      {
        label: 'Extras',
        text: '**Concierge Advisor** + 1 experiencia premium en pareja + perks exclusivos.',
      },
      {
        label: '**Destination Decoded**',
        text: 'Guia curada por nuestros Concierge Advisors, con claves que pocos conocen.',
      },
    ],
    closingLine:
      'Un viaje que se cuida como se cuida una relación: con detalle y paciencia.',
    ctaLabel: 'Viajen distinto →',
  },
  {
    id: 'atelier-getaway',
    name: 'Atelier Getaway',
    subtitle: 'Amor a medida',
    priceLabel: 'Desde 1200 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Customizable' },
      { label: 'Destinos', text: 'Customizable' },
      { label: 'Transporte', text: 'Multimodal / a medida.' },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Luxury / de autor / Cadenas Hoteleras A1.',
      },
      {
        label: 'Extras',
        text: 'Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.',
      },
      {
        label: 'Beneficios',
        text: '**Co-creación con un Luxury Travel Advisor + equipo 24/7**. ',
      },
    ],
    closingLine:
      'Un lienzo en blanco para crear la escapada que nadie más podrá repetir.',
    ctaLabel: 'Creen lo irrepetible →',
  },
];
