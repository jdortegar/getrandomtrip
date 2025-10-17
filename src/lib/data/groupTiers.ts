import type { Tier } from '@/types/planner';

export const groupTiers: Tier[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    subtitle: 'Lo esencial, compartido.',
    priceLabel: 'Hasta 350 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Máximo 2 noches.' },
      {
        label: 'Transporte',
        text: 'Low cost (buses o vuelos off-peak).',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Menor disponibilidad; con restricciones y bloqueos.',
      },
      { label: 'Alojamiento', text: 'Midscale (3★ o equivalentes).' },
      {
        label: 'Extras',
        text: 'Guía esencial con recomendaciones simples para el grupo.',
      },
    ],
    closingLine:
      'Una escapada simple para sincronizar agendas, para que solo se preocupen por disfrutar juntos.',
    ctaLabel: 'Activen su Essenza →',
  },
  {
    id: 'modo-explora',
    name: 'Modo Explora',
    subtitle: 'Activo y flexible, en equipo.',
    priceLabel: 'Hasta 550 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 3 noches.' },
      {
        label: 'Transporte',
        text: 'Multimodal, horarios flexibles.',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      },
      { label: 'Alojamiento', text: 'Midscale – Upper Midscale.' },
      {
        label: 'Extras',
        text: 'Guía Randomtrip con actividades y sugerencias para distintos ritmos dentro del grupo.',
      },
    ],
    closingLine:
      'Para grupos que quieren explorar a su ritmo, con la flexibilidad que necesitan.',
    ctaLabel: 'Activen su Modo Explora →',
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    subtitle: 'Más capas, más momentos.',
    priceLabel: 'Hasta 850 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 4 noches.' },
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
      {
        label: 'Extras',
        text: '1 experiencia curada especial para el grupo (ej.: brindis privado, caminata guiada al atardecer).',
      },
      {
        label: 'Destination Decoded',
        text: 'Guía personalizada para que cada día sea una sorpresa curada.',
      },
    ],
    closingLine:
      'Más días, más actividades, más anécdotas que se vuelven leyenda compartida.',
    ctaLabel: 'Suban de nivel con Explora+ →',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Curaduría artesanal para su tribu.',
    priceLabel: 'Hasta 1200 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 5 noches.' },
      {
        label: 'Transporte',
        text: 'Multimodal.',
        footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
      },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Upper-Upscale (boutique, diseño, stays con alma).',
      },
      {
        label: 'Extras',
        text: 'Concierge Advisor + 1 experiencia premium grupal (ej.: mesa del chef, excursión privada) + perks.',
      },
      {
        label: 'Destination Decoded',
        text: 'Guía curada por nuestros Concierge Advisors, con claves que pocos conocen.',
      },
    ],
    closingLine:
      'Una experiencia grupal única, con detalles que marcan la diferencia.',
    ctaLabel: 'Viajen distinto con Bivouac →',
  },
  {
    id: 'atelier-getaway',
    name: 'Atelier Getaway',
    subtitle: 'Distinción, a medida (Group Edition).',
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
      'El lujo de viajar como tribu, con todo resuelto y experiencias irrepetibles.',
    ctaLabel: 'Creen lo irrepetible →',
  },
];
