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
    priceFootnote: "💑 Precio por persona (base doble)",
    cta: "👉 Reservar fácil",
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
    cta: "👉 Activen su modo Explora",
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
    cta: "👉 Suban de nivel",
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
    cta: "👉 Viajen distinto",
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
    cta: "👉 A un clic de lo extraordinario",
    features: [
      "Duración: Customizable.",
      "Transporte: Multimodal. *Extras Customizables",
      "Fechas: Sin bloqueos.",
      "Alojamiento: Luxury / de autor / cadenas A1.",
      "Extras: Co-creación con Luxury Travel Advisor, Equipo soporte 24/7 + 2 Experiencias Premium, Traslados privados, Salas VIP, etc.",
    ],
  },,
];