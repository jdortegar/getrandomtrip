import type { Tier } from '@/types/planner';

export const pawsTiers: Tier[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    subtitle: 'Lo esencial con estilo',
    priceLabel: 'Hasta 460 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
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
      {
        label: 'Alojamiento',
        text: 'Midscale (3★ o equivalentes, pet-friendly).',
      },
      { label: 'Extras', text: 'Guía esencial con mapa pet-friendly.' },
    ],
    closingLine:
      'Un escape simple, donde tu mascota no es un extra, sino parte del plan.',
    ctaLabel: 'Empiecen con lo básico →',
  },
  {
    id: 'modo-explora',
    name: 'Modo Explora',
    subtitle: 'Viaje activo y flexible',
    priceLabel: 'Hasta 650 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
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
      {
        label: 'Alojamiento',
        text: 'Midscale – Upper Midscale pet-friendly.',
      },
      {
        label: 'Extras',
        text: 'Guía Randomtrip con rutas, spots de juego y actividades pet-friendly.',
      },
    ],
    closingLine:
      'Senderos y rincones pensados para descubrir junto a tu compañer@, con libertad y sin estrés.',
    ctaLabel: 'Exploren a cuatro patas →',
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    subtitle: 'Más capas, más momentos',
    priceLabel: 'Hasta 1100 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
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
      {
        label: 'Alojamiento',
        text: 'Upscale asegurado, habitaciones pet-friendly premium.',
      },
      {
        label: 'Extras',
        text: '1 experiencia curada (ej.: trail o day trip pet-friendly).',
      },
      {
        label: 'Destination Decoded',
        text: 'Guía personalizada para que cada día sea una sorpresa curada.',
      },
    ],
    closingLine:
      'Más días, más juegos, más huellas en la arena y en la memoria.',
    ctaLabel: 'Suban la aventura →',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Curaduría artesanal',
    priceLabel: 'Hasta 1550 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
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
        text: 'Upper Upscale pet-friendly. (boutique, diseño, experiencias locales).',
      },
      {
        label: 'Extras',
        text: 'Concierge Advisor + 1 experiencia premium + perks (late check-out, upgrade, amenities pet).',
      },
      {
        label: 'Destination Decoded',
        text: 'Guía curada por nuestros Concierge Advisors, con claves que pocos conocen.',
      },
    ],
    closingLine:
      'Un viaje premium, curado al detalle para vos y tu compañero de cuatro patas.',
    ctaLabel: 'Viajen con huellas Bivouac →',
  },
  {
    id: 'atelier-getaway',
    name: 'Atelier Getaway',
    subtitle: 'Experiencia a medida',
    priceLabel: 'Desde 1550 USD',
    priceFootnote: '· por persona + compañer@ de 4 patas',
    features: [
      { label: 'Duración', text: 'Customizable' },
      { label: 'Transporte', text: 'Multimodal / a medida.' },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Luxury / de autor / Cadenas Hoteleras A1 pet-friendly.',
      },
      {
        label: 'Extras',
        text: 'Co-creación con un Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.',
      },
    ],
    closingLine:
      'Una experiencia exclusiva donde cada momento está diseñado para ambos.',
    ctaLabel: 'Creen lo extraordinario →',
  },
];
