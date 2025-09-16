export interface TierFeature {
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
      { text: '📍 Duración: Máx 2 noches' },
      {
        text: '✈️ Transporte: Low cost (buses o vuelos off-peak).',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        text: '🗓️ Fechas: Menor disponibilidad, con restricciones y bloqueos.',
      },
      { text: '🛏️ Alojamiento: Midscale (3★ o equivalentes).' },
      {
        text: '🎁 Extras: Guía esencial del destino.',
      },
    ],
    closingLine:
      '📝 Un escape breve, suficiente para mirarse distinto y recordar por qué empezó todo.',
    ctaLabel: 'Den el primer paso →',
  },
  {
    id: 'modo-explora',
    name: 'Modo Explora',
    subtitle: 'Viaje activo y flexible',
    priceLabel: 'Hasta 550 USD',
    priceFootnote: '· por persona',
    features: [
      { text: '📍 Duración: Hasta 3 noches' },
      {
        text: '✈️ Transporte: Multimodal, horarios flexibles.',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        text: '🗓️ Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      },
      { text: '🛏️ Alojamiento: Mid-to-Upscale.' },
      { text: '🎁 Extras: Guía Randomtrip diseñada para descubrir juntos.' },
    ],
    closingLine:
      '📝 Para los que creen que la mejor forma de enamorarse es perderse y reencontrarse.',
    ctaLabel: 'Exploren su historia →',
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    subtitle: 'Más capas, más momentos',
    priceLabel: 'Hasta 850 USD',
    priceFootnote: '· por persona',
    features: [
      { text: '📍 Duración: Hasta 4 noches' },
      {
        text: '✈️ Transporte: Multimodal.',
        footnote:
          'Carry-on incluido; selección de asiento y bodega no incluidos.',
      },
      { text: '🗓️ Fechas: Alta disponibilidad, incluso en feriados/puentes.' },
      { text: '🛏️ Alojamiento: Upscale asegurado.' },
      { text: '🎁 Extras: 1 experiencia especial en pareja.' },
      {
        text: '🌟 **Destination Decoded**: guia personalizada para que cada día sea una sorpresa curada.',
      },
    ],
    closingLine:
      '📝 Más noches, más sorpresas, más excusas para coleccionar recuerdos a dos voces.',
    ctaLabel: 'Suban la apuesta →',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Romance artesanal',
    priceLabel: 'Hasta 1200 USD',
    priceFootnote: '· por persona',
    features: [
      { text: '📍 Duración: Hasta 5 noches' },
      {
        text: '✈️ Transporte: Multimodal.',
        footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
      },
      { text: '🗓️ Fechas: Sin bloqueos.' },
      {
        text: '🛏️ Alojamiento: Upper Upscale (boutique, diseño, experiencias locales).',
      },
      {
        text: '🎁 Extras: **Concierge Advisor** + 1 experiencia premium en pareja + perks exclusivos.',
      },
      {
        text: '🌟 **Destination Decoded**: guia curada por nuestros Concierge Advisors, con claves que pocos conocen.',
      },
    ],
    closingLine:
      '📝 Un viaje que se cuida como se cuida una relación: con detalle y paciencia.',
    ctaLabel: 'Viajen distinto →',
  },
  {
    id: 'atelier-getaway',
    name: 'Atelier Getaway',
    subtitle: 'Amor a medida',
    priceLabel: 'Desde 1200 USD',
    priceFootnote: '· por persona',
    features: [
      { text: '📍 Duración: Customizable' },
      { text: '✈️ Transporte: Multimodal / a medida.' },
      { text: '🗓️ Fechas: Sin bloqueos.' },
      { text: '🛏️ Alojamiento: Luxury / de autor / Cadenas Hoteleras A1.' },
      {
        text: '💎 Extras: **Co-creación con un Luxury Travel Advisor + equipo 24/7**. Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.',
      },
    ],
    closingLine:
      '📝 Un lienzo en blanco para crear la escapada que nadie más podrá repetir.',
    ctaLabel: 'Creen lo irrepetible →',
  },
];
