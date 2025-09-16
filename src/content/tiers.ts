export type TierKey = 'essenza' | 'explora' | 'explora-plus' | 'exploraPlus' | 'bivouac' | 'atelier' | 'atelier-getaway' | 'modo-explora';

export interface Tier {
  key: TierKey;
  title: string;
  cta: string;
  tagline?: string;
  price?: string;
  bullets: string[];
  testid?: string;
}



export const SOLO_TIERS: Tier[] = [
  {
    key: 'essenza',
    title: '🌱 Essenza — Lo esencial con estilo',
    price: '455 USD · por persona',
    bullets: [
      'Duración: Máx 2 noches',
      'Transporte: Low cost (buses o vuelos off-peak). Selección de asiento, carry-on y bodega no incluidos.',
      'Fechas: Menor disponibilidad, con restricciones y bloqueos.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Guía esencial para moverte sin complicaciones.',
      '📝 Un escape breve para perderte en lo simple y encontrarte en lo inesperado.',
    ],
    cta: 'Arranca tu Essenza →',
  },
  {
    key: 'explora',
    title: '🌿 Modo Explora — Activo y flexible',
    price: '650 USD · por persona',
    bullets: [
      'Duración: Hasta 3 noches',
      'Transporte: Multimodal, horarios flexibles. Selección de asiento, carry-on y bodega no incluidos.',
      'Fechas: Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      'Alojamiento: Midscale – Upper Midscale.',
      'Extras: Guía Randomtrip Decode con pistas para descubrir a tu ritmo.',
      '📝 Diseñado para quienes viajan livianos y quieren descubrir sin guion.',
    ],
    cta: 'Activa tu modo Explora →',
  },
  {
    key: 'exploraPlus',
    title: '💫 Explora+ — Más capas, más momentos',
    price: '1105 USD · por persona',
    bullets: [
      'Duración: Hasta 4 noches',
      'Transporte: Multimodal. Carry-on incluido; selección de asiento y bodega no incluidos.',
      'Fechas: Alta disponibilidad, incluso en feriados/puentes.',
      'Alojamiento: Upscale asegurado.',
      'Extras: Decode personalizado + 1 experiencia curada en solitario.',
      '📝 Más noches, más encuentros inesperados y más razones para volver distinto.',
    ],
    cta: 'Sube de nivel →',
  },
  {
    key: 'bivouac',
    title: '🔥 Bivouac — Curaduría artesanal',
    price: '1560 USD · por persona',
    bullets: [
      'Duración: Hasta 5 noches',
      'Transporte: Multimodal. Carry-on incluido; selección de asiento/bodega opcional.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upper Upscale (boutique, diseño, stays con alma).',
      'Extras: Concierge Advisor + 1 experiencia premium + perks.',
      '📝 Un viaje íntimo, cuidado al detalle, que convierte la soledad en un lujo personal.',
    ],
    cta: 'Viaja distinto →',
  },
  {
    key: 'atelier',
    title: '✨ Atelier Getaway — Distinción, sin esfuerzo',
    price: 'Desde 1560 USD · por persona',
    bullets: [
      'Duración: Customizable',
      'Transporte: Multimodal / a medida.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium diseñadas para vos. Perks (traslados privados, salas VIP, reservas prioritarias, atenciones exclusivas).',
      '📝 El lujo de viajar sin testigos, con experiencias que se vuelven confidenciales.',
    ],
    cta: 'Crea lo irrepetible →',
  },
];

export const TRIPPERS_TIERS: Tier[] = [
  {
    key: 'essenza',
    title: '🌱 Essenza — Lo esencial con estilo',
    cta: 'Elige Essenza →',
    testid: 'cta-tier-essenza',
    bullets: [
      'Hasta 350 USD · por persona',
      'Duración: Máx 2 noches',
      'Transporte: Low cost (buses o vuelos off-peak).',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Guía esencial del destino con recomendaciones locales.',
      '📝 Un escape breve para desconectar y volver con nuevas historias.',
    ],
  },
  {
    key: 'explora',
    title: '🌿 Modo Explora — Viaje activo y flexible',
    cta: 'Elige Explora →',
    testid: 'cta-tier-explora',
    bullets: [
      'Hasta 500 USD · por persona',
      'Duración: Hasta 3 noches',
      'Transporte: Multimodal, horarios flexibles.',
      'Alojamiento: Mid-to-Upscale.',
      'Extras: Guía Randomtrip Decode con pistas para descubrir a tu ritmo.',
      '📝 Para quienes creen que la mejor forma de viajar es perderse… y reencontrarse.',
    ],
  },
  {
    key: 'exploraPlus',
    title: '💫 Explora+ — Más capas, más momentos',
    cta: 'Elige Explora+ →',
    testid: 'cta-tier-exploraplus',
    bullets: [
      'Hasta 850 USD · por persona',
      'Duración: Hasta 4 noches',
      'Transporte: Multimodal. Carry-on incluido.',
      'Alojamiento: Upscale asegurado.',
      'Extras: Decode personalizado + 1 experiencia especial incluida.',
      '📝 Más noches, más sorpresas, más excusas para coleccionar recuerdos.',
    ],
  },
  {
    key: 'bivouac',
    title: '🔥 Bivouac — Curaduría artesanal',
    cta: 'Elige Bivouac →',
    testid: 'cta-tier-bivouac',
    bullets: [
      'Hasta 1200 USD · por persona',
      'Duración: Hasta 5 noches',
      'Transporte: Multimodal. Carry-on incluido.',
      'Alojamiento: Upper Upscale (boutique, diseño, experiencias locales).',
      'Extras: Concierge Advisor + 1 experiencia premium + perks exclusivos.',
      '📝 Un viaje que se cuida con detalle y paciencia.',
    ],
  },
  {
    key: 'atelier',
    title: '✨ Atelier Getaway — Experiencia a medida',
    cta: 'Elige Atelier →',
    testid: 'cta-tier-atelier',
    bullets: [
      'Desde 1200 USD · por persona',
      'Duración: Customizable',
      'Transporte: Multimodal / a medida.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium.',
      '📝 Un lienzo en blanco para crear una escapada que nadie más podrá repetir.',
    ],
  },
];
