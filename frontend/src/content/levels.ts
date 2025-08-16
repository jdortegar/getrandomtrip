export type ExperienceLevel = {
  id: string;
  name: string;
  priceLabel: string;        // ej: "Hasta 350 USD"
  subtitle: string;          // tagline
  priceFootnote?: string;    // "Precio por persona (base doble)"
  cta: string;               // texto del botón
  features: string[];        // bullets
};

export const COUPLE_LEVELS: ExperienceLevel[] = [
  {
    id: "essenza",
    name: "Essenza",
    subtitle: "Lo esencial con estilo.",
    priceLabel: "Hasta 350 USD",
    priceFootnote: "Precio por persona (base doble)",
    cta: "Reservá fácil",
    features: [
      "Duración: Máximo 2 noches.",
      "Transporte: Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos.",
      "Fechas: Menor disponibilidad; con restricciones y fechas bloqueadas.",
      "Alojamiento: Midscale (3★ o equivalentes).",
      "Extras: Guía esencial del destino.",
    ],
  },
  {
    id: "modo-explora",
    name: "Modo Explora",
    subtitle: "Viaje activo y flexible.",
    priceLabel: "Hasta 500 USD",
    priceFootnote: "Precio por persona (base doble)",
    cta: "Activá tu modo",
    features: [
      "Duración: Hasta 3 noches.",
      "Transporte: Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos.",
      "Fechas: Mayor disponibilidad; feriados/puentes con bloqueos.",
      "Alojamiento: Mid-to-Upscale.",
      "Extras: Guía curada “Randomtrip Decode”.",
    ],
  },
  {
    id: "explora-plus",
    name: "Explora+",
    subtitle: "Más capas, más detalles.",
    priceLabel: "Hasta 850 USD",
    priceFootnote: "Precio por persona (base doble)",
    cta: "Subí de nivel",
    features: [
      "Duración: Hasta 4 noches.",
      "Transporte: Multimodal. En vuelos: asientos, carry-on y bodega no incluidos.",
      "Fechas: Alta disponibilidad, incluso feriados/puentes (con bloqueos festivos).",
      "Alojamiento: Upscale garantizado.",
      "Extras: Decode personalizado + 1 experiencia/actividad curada.",
    ],
  },
  {
    id: "bivouac",
    name: "Bivouac",
    subtitle: "Curaduría que se siente artesanal.",
    priceLabel: "Hasta 1200 USD",
    priceFootnote: "Precio por persona (base doble)",
    cta: "Viajá distinto",
    features: [
      "Duración: Hasta 5 noches.",
      "Transporte: Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida.",
      "Fechas: Sin fechas bloqueadas.",
      "Alojamiento: Upper-Upscale (diseño, boutique, experiencias locales).",
      "Extras: Concierge Advisors + 1 Experiencia Premium + perks (early/late & upgrade, sujetos a disponibilidad).",
    ],
  },
  {
    id: "atelier-getaway",
    name: "Atelier Getaway",
    subtitle: "Distinción, sin esfuerzo.",
    priceLabel: "Desde 1200 USD",
    priceFootnote: "Precio por persona (base doble)",
    cta: "Curado para vos",
    features: [
      "Duración: Customizable.",
      "Alojamiento: Luxury / de autor / cadenas A1.",
      "Extras: Co-creación con Luxury Travel Advisor + equipo 24/7.",
      "Incluye: 2+ Experiencias Premium a medida.",
      "Perks: traslados privados, salas VIP, reservas prioritarias, regalos de marcas asociadas.",
    ],
  },
];