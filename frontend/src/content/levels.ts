export type ExperienceLevel = {
  id: string;
  name: string;
  priceLabel: string;
  subtitle: string;
  priceFootnote?: string;
  ctaLabel: string;
  features: string[];
  closingLine?: string;
  title?: string;
};

const COUPLE_CONTENT = {
  essenza: {
    title: 'Essenza',
    subtitle: 'Lo esencial con estilo',
    priceLabel: 'Hasta 350 USD',
    priceFootnote: '· por persona',
    bullets: [
      'Duración: Máx 2 noches',
      'Transporte: Low cost (buses o vuelos off-peak). Selección de asiento, carry-on y bodega no incluidos.',
      'Fechas: Menor disponibilidad, con restricciones y bloqueos.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Guía esencial diseñada para parejas que buscan la simpleza sin perder el encanto.'
    ],
    closingLine: '📝 Un escape breve, suficiente para mirarse distinto y recordar por qué empezó todo.',
    ctaLabel: 'Den el primer paso →'
  },
  explora: {
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible',
    priceLabel: 'Hasta 500 USD',
    priceFootnote: '· por persona',
    bullets: [
      'Duración: Hasta 3 noches',
      'Transporte: Multimodal, horarios flexibles. Selección de asiento, carry-on y bodega no incluidos.',
      'Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      'Alojamiento: Mid-to-Upscale.',
      'Extras: Guía Randomtrip Decode con pistas para descubrir juntos.'
    ],
    closingLine: '📝 Para los que creen que la mejor forma de enamorarse es perderse… y reencontrarse.',
    ctaLabel: 'Exploren su historia →'
  },
  exploraPlus: {
    title: 'Explora+',
    subtitle: 'Más capas, más momentos',
    priceLabel: 'Hasta 850 USD',
    priceFootnote: '· por persona',
    bullets: [
      'Duración: Hasta 4 noches',
      'Transporte: Multimodal. Carry-on incluido; selección de asiento y bodega no incluidos.',
      'Fechas: Alta disponibilidad, incluso en feriados/puentes.',
      'Alojamiento: Upscale asegurado.',
      'Extras: Decode personalizado + 1 experiencia especial en pareja.'
    ],
    closingLine: '📝 Más noches, más sorpresas, más excusas para coleccionar recuerdos a dos voces.',
    ctaLabel: 'Suban la apuesta →'
  },
  bivouac: {
    title: 'Bivouac',
    subtitle: 'Romance artesanal',
    priceLabel: 'Hasta 1200 USD',
    priceFootnote: '· por persona',
    bullets: [
      'Duración: Hasta 5 noches',
      'Transporte: Multimodal. Carry-on incluido; selección de asiento/bodega opcional.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upper Upscale (boutique, diseño, experiencias locales).',
      'Extras: Concierge Advisor + 1 experiencia premium en pareja + perks exclusivos.'
    ],
    closingLine: '📝 Un viaje que se cuida como se cuida una relación: con detalle y paciencia.',
    ctaLabel: 'Viajen distinto →'
  },
  atelier: {
    title: 'Atelier Getaway',
    subtitle: 'Amor a medida',
    priceLabel: 'Desde 1200 USD',
    priceFootnote: '· por persona',
    bullets: [
      'Duración: Customizable',
      'Transporte: Multimodal / a medida.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium diseñadas a medida. Perks (traslados privados, salas VIP, reservas prioritarias, atenciones exclusivas).'
    ],
    closingLine: '📝 Un lienzo en blanco para crear la escapada que nadie más podrá repetir.',
    ctaLabel: 'Creen lo irrepetible →'
  }
} as const;

const originalCoupleLevels: ExperienceLevel[] = [
  {
    id: "essenza",
    name: "Essenza",
    subtitle: "Lo esencial con estilo.",
    priceLabel: "Hasta 350 USD",
    priceFootnote: "💑 Precio por persona (base doble)",
    ctaLabel: "👉 Reservar fácil",
    features: [
      "Duración: Máximo 2 noches.",
      "Transporte: Low cost (buses o vuelos off-peak). *Seleccion de asiento, carry-on y bodega - no incluido.",
      "Fechas: Menor disponibilidad; con restricciones y bloqueos.",
      "Alojamiento: Midscale (3★ o equivalentes).",
      "Extras: Guía esencial para explorar juntos.",
    ],
  },
  {
    id: "modo-explora",
    name: "Modo Explora",
    subtitle: "Viaje activo y flexible.",
    priceLabel: "Hasta 500 USD",
    priceFootnote: "💑 Precio por persona (base doble)",
    ctaLabel: "👉 Activen su modo Explora",
    features: [
      "Duración: Hasta 3 noches.",
      "Transporte: Multimodal, Horarios flexibles. *Seleccion de asiento, carry-on y bodega - no incluido.",
      "Fechas: Mayor disponibilidad; algunos feriados/puentes con bloqueos.",
      "Alojamiento: Midscale - Upper Midscale.",
      "Extras: Guía \"Randomtrip Decode\" - Curada por los mejores Trippers",
    ],
  },
    {
    id: "explora-plus",
    name: "Explora+",
    subtitle: "Más capas, más detalles.",
    priceLabel: "Hasta 850 USD",
    priceFootnote: "💑 Precio por persona (base doble)",
    ctaLabel: "👉 Suban de nivel",
    features: [
      "Duración: Hasta 4 noches.",
      "Transporte: Multimodal. * Carry-on Incluido - *Seleccion de asiento y bodega - no incluido.",
      "Fechas: Alta disponibilidad, incluso feriados/puentes.",
      "Alojamiento: Upscale.",
      "Extras: Guía \"Randomtrip Decode\" - Personalizado + 1 experiencia/actividad",
    ],
  },
  {
    id: "bivouac",
    name: "Bivouac",
    subtitle: "Curaduría que se siente artesanal.",
    priceLabel: "Hasta 1200 USD",
    priceFootnote: "💑 Precio por persona (base doble)",
    ctaLabel: "👉 Viajen distinto",
    features: [
      "Duración: Hasta 5 noches.",
      "Transporte: Multimodal. * Carry-on Incluido - *Seleccion de asiento o bodega opcional.",
      "Fechas: Sin bloqueos.",
      "Alojamiento: Upscale - Upper Upscale.",
      "Extras: Concierge Advisors + 1 Experiencia Premium + Perks.",
    ],
  },
    {
    id: "atelier-getaway",
    name: "Atelier Getaway",
    subtitle: "Distinción, sin esfuerzo.",
    priceLabel: "Desde 1200 USD",
    priceFootnote: "💑 Precio por persona (base doble)",
    ctaLabel: "👉 A un clic de lo extraordinario",
    features: [
      "Duración: Customizable.",
      "Transporte: Multimodal. *Extras Customizables",
      "Fechas: Sin bloqueos.",
      "Alojamiento: Luxury / de autor / cadenas A1.",
      "Extras: Co-creación con Luxury Travel Advisor, Equipo soporte 24/7 + 2 Experiencias Premium, Traslados privados, Salas VIP, etc.",
    ],
  },
];

export const COUPLE_LEVELS = originalCoupleLevels.map(tier => {
  const override = COUPLE_CONTENT[tier.id as keyof typeof COUPLE_CONTENT];
  if (override) {
    return {
      ...tier,
      name: override.title,
      subtitle: override.subtitle,
      priceLabel: override.priceLabel,
      priceFootnote: override.priceFootnote,
      features: override.bullets,
      closingLine: override.closingLine,
      ctaLabel: override.ctaLabel,
    };
  }
  return tier;
});
