export type Tier = {
  id: string;
  title: string;
  subtitle?: string; // Added
  priceLabel: string;    // texto del precio (p.ej. “hasta US$ X”)
  bullets: string[];  // highlights changed to bullets
  priceFootnote?: string; // Added
  ctaLabel?: string; // Added
};

export const BASE_TIERS: Tier[] = [
  {
    id: 'essenza',
    title: 'Essenza',
    subtitle: 'Lo esencial con estilo.',
    priceLabel: 'Hasta 350 USD',
    bullets: [
      'Duración: Máximo 2 noches.',
      'Transporte: Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos.',
      'Fechas: Menor disponibilidad; con restricciones y bloqueos.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Una guía esencial pensada para explorar juntos sin apuros.',
    ],
    priceFootnote: '💑 Precio por persona (base doble)',
    ctaLabel: 'Reservar fácil',
  },
  {
    id: 'modo-explora',
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible.',
    priceLabel: 'Hasta 500 USD',
    bullets: [
      'Duración: Hasta 3 noches.',
      'Transporte: Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos.',
      'Fechas: Mayor disponibilidad; feriados/puentes con bloqueos.',
      'Alojamiento: Mid-to-Upscale.',
      'Extras: Guía curada “Randomtrip Decode” con pistas para descubrir en pareja.',
    ],
    priceFootnote: '💑 Precio por persona (base doble)',
    ctaLabel: 'Activen su modo',
  },
  {
    id: 'explora-plus',
    title: 'Explora+',
    subtitle: 'Más capas, más detalles.',
    priceLabel: 'Hasta 850 USD',
    bullets: [
      'Duración: Hasta 4 noches.',
      'Transporte: Multimodal. En vuelos: asientos, carry-on y bodega no incluidos.',
      'Fechas: Alta disponibilidad, incluso feriados/puentes (con bloqueos festivos).',
      'Alojamiento: Upscale garantizado.',
      'Extras: Decode personalizado + 1 experiencia/actividad curada para dos.',
    ],
    priceFootnote: '💑 Precio por persona (base doble)',
    ctaLabel: 'Suban de nivel',
  },
  {
    id: 'bivouac',
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal.',
    priceLabel: 'Hasta 1200 USD',
    bullets: [
      'Duración: Hasta 5 noches.',
      'Transporte: Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida.',
      'Fechas: Sin fechas bloqueadas.',
      'Alojamiento: Upper-Upscale (diseño, boutique, experiencias locales).',
      'Extras: Concierge Advisors + 1 Experiencia Premium para compartir + perks (early/late & upgrade sujetos a dispo).',
    ],
    priceFootnote: '💑 Precio por persona (base doble)',
    ctaLabel: 'Viajen distinto',
  },
  {
    id: 'atelier-getaway',
    title: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo.',
    priceLabel: 'Desde 1200 USD',
    bullets: [
      'Duración: Customizable.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con Luxury Travel Advisor + equipo 24/7.',
      'Incluye: 2+ Experiencias Premium a medida, diseñadas para dos.',
      'Perks: traslados privados, salas VIP, reservas prioritarias, regalos de marcas asociadas.',
    ],
    priceFootnote: '💑 Precio por persona (base doble)',
    ctaLabel: 'A un clic de lo extraordinario',
  },
];