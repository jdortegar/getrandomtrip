/**
 * =================================================================
 *  Sistema Unificado de Niveles de Experiencia Randomtrip
 * =================================================================
 *
 * Este archivo centraliza el contenido y las reglas de negocio para
 * las 5 tarjetas de niveles de experiencia (Essenza → Atelier)
 * en todos los segmentos "By Traveller".
 *
 * Reglas de Precios:
 * - Base: Precios estándar por persona.
 * - Solo & Paws: +30% sobre el precio base.
 * - Honeymoon: +50% sobre el precio base.
 *
 * Reglas de Tarjetas:
 * - Honeymoon: Muestra únicamente la tarjeta "Atelier Getaway".
 * - Resto de segmentos: Muestran las 5 tarjetas.
 *
 */

// --- Helpers de Precios ---

const BASE_PRICES = {
  essenza: 350,
  explora: 500,
  exploraPlus: 850,
  bivouac: 1200,
  atelier: 1200,
};

/**
 * Calcula el precio final aplicando un multiplicador y redondeando a la decena más cercana.
 * @param basePrice - El precio base del nivel.
 * @param multiplier - El multiplicador del segmento (ej: 1.3 para +30%).
 * @returns El precio calculado y redondeado.
 */
const calculatePrice = (basePrice: number, multiplier = 1): number => {
  const increasedPrice = basePrice * multiplier;
  return Math.round(increasedPrice / 10) * 10;
};

// --- Contenido por Segmento ---

const COUPLE_CONTENT = {
  essenza: {
    title: 'Essenza',
    subtitle: 'Lo esencial con estilo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    bullets: [
      'Duración del viaje: Máximo 2 noches.',
      'Destinos: Nacional (mismo país de origen).',
      'Transporte: Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Experiencias únicas: —',
      'Extras: Una guía esencial pensada para explorar juntos sin apuros.',
      'Destination Decoded: Pistas básicas para descubrir el destino.',
    ],
    closingLine: 'Un escape breve para mirarse distinto.',
    ctaLabel: 'Reservar fácil →',
  },
  explora: {
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    bullets: [
      'Duración del viaje: Hasta 3 noches.',
      'Destinos: Nacional + países vecinos.',
      'Transporte: Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos.',
      'Alojamiento: Mid-to-Upscale.',
      'Experiencias únicas: —',
      'Extras: Recomendaciones locales y sorpresas pequeñas.',
      'Destination Decoded: Guía curada "Randomtrip Decode" con pistas para descubrir en pareja.',
    ],
    closingLine: 'Para los que creen que enamorarse es perderse.',
    ctaLabel: 'Activen su modo →',
  },
  exploraPlus: {
    title: 'Explora+',
    subtitle: 'Más capas, más detalles.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    bullets: [
      'Duración del viaje: Hasta 4 noches.',
      'Destinos: Nacional + vecinos + región.',
      'Transporte: Multimodal. En vuelos: asientos, carry-on y bodega no incluidos.',
      'Alojamiento: Upscale garantizado.',
      'Experiencias únicas: 1 experiencia/actividad curada para dos.',
      'Extras: Amenities locales y detalles especiales.',
      'Destination Decoded: Decode personalizado con recomendaciones exclusivas.',
    ],
    closingLine: 'Más excusas para coleccionar recuerdos a dos voces.',
    ctaLabel: 'Suban de nivel →',
  },
  bivouac: {
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    bullets: [
      'Duración del viaje: Hasta 5 noches.',
      'Destinos: Toda América (sin límites).',
      'Transporte: Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida.',
      'Alojamiento: Upper-Upscale (diseño, boutique, experiencias locales).',
      'Experiencias únicas: 1 experiencia Premium para compartir.',
      'Extras: Concierge Advisors + perks (early/late & upgrade sujetos a dispo).',
      'Destination Decoded: Guía artesanal con secretos locales y activaciones exclusivas.',
    ],
    closingLine: 'Un viaje que se cuida como se cuida una relación.',
    ctaLabel: 'Viajen distinto →',
  },
  atelier: {
    title: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    bullets: [
      'Duración del viaje: Customizable (5+ noches recomendadas).',
      'Destinos: Sin límites geográficos.',
      'Transporte: First class (priority boarding, lounge, asiento+carry-on+bodega incluidos).',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Experiencias únicas: 2+ Experiencias Premium a medida, diseñadas para dos.',
      'Extras: Co-creación con Luxury Travel Advisor + equipo 24/7 + traslados privados + regalos.',
      'Destination Decoded: Curaduría completa con accesos VIP y experiencias irrepetibles.',
    ],
    closingLine: 'Un lienzo en blanco para su historia.',
    ctaLabel: 'A un clic de lo extraordinario →',
  },
};

const PAWS_CONTENT = {
  essenza: {
    title: 'Essenza — Lo esencial, pet-friendly.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Máximo 2 noches.',
      'Transporte: Low cost (cuando aplica).',
      'Fechas: Disponibilidad acotada con restricciones.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Guía esencial + tips para moverse con tu mascota.',
    ],
    closingLine: 'Un escape simple donde tu mascota es parte del plan.',
    ctaLabel: 'Reservar fácil →',
  },
  explora: {
    title: 'Modo Explora — Activo y flexible (Pet Edition).',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Hasta 3 noches.',
      'Transporte: Multimodal; opciones amigables con mascotas donde sea posible.',
      'Fechas: Buena disponibilidad; algunos bloqueos en feriados.',
      'Alojamiento: Mid-to-Upscale pet-friendly.',
      'Extras: Randomtrip Decode con paseos y espacios dog/cat-friendly.',
    ],
    closingLine: 'Senderos y rincones para descubrir juntos, sin estrés.',
    ctaLabel: 'Activen su modo →',
  },
  'explora-plus': {
    title: 'Explora+ — Más días, más huellas.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Hasta 4 noches.',
      'Transporte: Multimodal.',
      'Fechas: Alta disponibilidad (con bloqueos festivos).',
      'Alojamiento: Upscale asegurado, preferencia pet-friendly.',
      'Extras: Decode personalizado + 1 experiencia curada para ambos.',
    ],
    closingLine: 'Más juegos, más memoria compartida.',
    ctaLabel: 'Suban de nivel →',
  },
  bivouac: {
    title: 'Bivouac — Curaduría artesanal (Pet Edition).',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Hasta 5 noches.',
      'Transporte: Multimodal (comodidad priorizada).',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upper-Upscale pet-friendly.',
      'Extras: Concierge Advisor + 1 experiencia premium con tu mascota + perks.',
    ],
    closingLine: 'Un viaje pensado al detalle para los dos.',
    ctaLabel: 'Viajen distinto →',
  },
  atelier: {
    title: 'Atelier Getaway — Distinción, a medida (Pet Edition).',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Customizable.',
      'Alojamiento: Luxury / de autor con protocolos pet-friendly.',
      'Extras: Co-creación con Luxury Travel Advisor + 24/7.',
      'Incluye: 2+ experiencias premium diseñadas para ambos.',
      'Perks: traslados privados, salas VIP (cuando aplica), reservas prioritarias.',
    ],
    closingLine:
      'Cada momento, diseñado para vos y tu compañero de cuatro patas.',
    ctaLabel: 'A un clic de lo extraordinario →',
  },
};

const HONEYMOON_CONTENT = {
  atelier: {
    title: 'Atelier Getaway — Amor a medida',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.5)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    bullets: [
      'Duración: Customizable.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7.',
      'Incluye: 2+ experiencias premium diseñadas a medida.',
      'Perks: traslados privados, salas VIP, reservas prioritarias, regalos de marcas asociadas.',
    ],
    closingLine:
      'Un lienzo en blanco para crear la luna de miel que no se repetirá jamás.',
    ctaLabel: 'Creen lo irrepetible →',
  },
};

const SOLO_CONTENT = {
  essenza: {
    title: 'Essenza — Lo esencial con estilo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Máximo 2 noches.',
      'Transporte: Low cost (buses o vuelos off-peak). Asiento garantizado, carry-on opcional.',
      'Fechas: Menor disponibilidad; con restricciones.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Una guía esencial pensada para que explores a tu manera, sin apuro.',
    ],
    closingLine: 'Un escape breve para perderte en lo simple y encontrarte.',
    ctaLabel: 'Reservá fácil →',
  },
  explora: {
    title: 'Modo Explora — Viaje activo y flexible.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Hasta 3 noches.',
      'Transporte: Multimodal. En vuelos: asiento garantizado, carry-on opcional.',
      'Fechas: Mayor disponibilidad, con algunos bloqueos en feriados.',
      'Alojamiento: Mid-to-Upscale.',
      'Extras: “Randomtrip Decode” con pistas para abrirte camino a tu aire.',
    ],
    closingLine: 'Diseñado para descubrir a tu propio ritmo.',
    ctaLabel: 'Activá tu modo →',
  },
  'explora-plus': {
    title: 'Explora+ — Más capas, más descubrimientos.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Hasta 4 noches.',
      'Transporte: Multimodal. En vuelos: asiento garantizado, carry-on opcional.',
      'Fechas: Alta disponibilidad, incluso en feriados (con bloqueos festivos).',
      'Alojamiento: Upscale asegurado.',
      'Extras: Decode personalizado + 1 experiencia curada solo para vos.',
    ],
    closingLine:
      'Más noches, más encuentros, más razones para volver distinto.',
    ctaLabel: 'Subí de nivel →',
  },
  bivouac: {
    title: 'Bivouac — Curaduría que se siente artesanal.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: Hasta 5 noches.',
      'Transporte: Multimodal. En vuelos: asiento y carry-on incluidos.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upper-Upscale (boutique, diseño, experiencias locales).',
      'Extras: Concierge Advisor + 1 experiencia premium + perks (early/late & upgrade sujetos a dispo).',
    ],
    closingLine:
      'Un viaje cuidado, íntimo y con detalles que marcan la diferencia.',
    ctaLabel: 'Viajá distinto →',
  },
  atelier: {
    title: 'Atelier Getaway — Distinción, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.3)} USD`,
    priceFootnote: 'por persona',
    bullets: [
      'Duración: A medida.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7.',
      'Incluye: 2+ experiencias premium a medida.',
      'Perks: traslados privados, salas VIP, reservas prioritarias, regalos de marcas asociadas.',
    ],
    closingLine:
      'El lujo de viajar sin testigos, con experiencias confidenciales.',
    ctaLabel: 'A un clic de lo impredecible →',
  },
};

const FAMILY_CONTENT = {
  essenza: {
    title: 'Essenza — Lo esencial, compartido.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Máximo 2 noches.',
      'Transporte: Low cost. Asientos, carry-on y bodega no incluidos.',
      'Fechas: Menor disponibilidad, con restricciones y bloqueos.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Guía esencial para que el grupo disfrute sin complicaciones.',
    ],
    closingLine: 'Un par de días que se contarán en la sobremesa.',
    ctaLabel: 'Activen su Essenza →',
  },
  explora: {
    title: 'Modo Explora — Activo y flexible, en equipo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Hasta 3 noches.',
      'Transporte: Multimodal. Asientos, carry-on y bodega no incluidos.',
      'Fechas: Mayor disponibilidad; algunos bloqueos en feriados.',
      'Alojamiento: Mid-to-Upscale.',
      'Extras: Randomtrip Decode con pistas para descubrir en grupo.',
    ],
    closingLine: 'Planes que sorprenden a grandes y chicos.',
    ctaLabel: 'Activen su Modo Explora →',
  },
  exploraPlus: {
    title: 'Explora+ — Más capas, más momentos (en plural).',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Hasta 4 noches.',
      'Transporte: Multimodal. Asientos, carry-on y bodega no incluidos.',
      'Fechas: Alta disponibilidad, incluso en feriados.',
      'Alojamiento: Upscale asegurado.',
      'Extras: Decode personalizado + 1 experiencia curada para el grupo.',
    ],
    closingLine: 'Más días, más juegos, más historias que se heredan.',
    ctaLabel: 'Suban de nivel con Explora+ →',
  },
  bivouac: {
    title: 'Bivouac — Curaduría artesanal para su tribu.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Hasta 5 noches.',
      'Transporte: Multimodal. Asientos y carry-on incluidos.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upper-Upscale (boutique, diseño, stays con alma).',
      'Extras: Concierge Advisor + 1 experiencia premium para el grupo + perks.',
    ],
    closingLine: 'Donde cada miembro de la familia encuentra su lugar.',
    ctaLabel: 'Viajen distinto con Bivouac →',
  },
  atelier: {
    title: 'Atelier Getaway — Distinción, a medida (Family Edition).',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Customizable.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con un Luxury Travel Advisor + equipo 24/7.',
      'Incluye: 2+ experiencias premium diseñadas a la medida del grupo.',
      'Perks: Traslados privados, salas VIP, reservas prioritarias, atenciones especiales.',
    ],
    closingLine:
      'Una experiencia donde la familia entera viaja como protagonista.',
    ctaLabel: 'A un clic de lo extraordinario →',
  },
};

const GROUP_CONTENT = {
  essenza: {
    title: 'Essenza — Lo esencial para sincronizar agendas.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Máximo 2 noches.',
      'Transporte: Low cost. Asientos, carry-on y bodega no incluidos.',
      'Fechas: Menor disponibilidad, con restricciones y bloqueos.',
      'Alojamiento: Midscale (3★ o equivalentes).',
      'Extras: Guía esencial con planes simples para disfrutar en grupo.',
    ],
    closingLine: 'Una escapada simple para reírse juntos otra vez.',
    ctaLabel: 'Reservar fácil →',
  },
  explora: {
    title: 'Modo Explora — Activo y flexible para el grupo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Hasta 3 noches.',
      'Transporte: Multimodal. Asientos, carry-on y bodega no incluidos.',
      'Fechas: Mayor disponibilidad; algunos bloqueos en feriados.',
      'Alojamiento: Mid-to-Upscale.',
      'Extras: Randomtrip Decode con pistas + actividades que admiten distintos ritmos.',
    ],
    closingLine: 'Planes flexibles que se adaptan a todos.',
    ctaLabel: 'Activen su modo →',
  },
  exploraPlus: {
    title: 'Explora+ — Más noches, más brindis.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Hasta 4 noches.',
      'Transporte: Multimodal. Asientos, carry-on y bodega no incluidos.',
      'Fechas: Alta disponibilidad, incluso feriados.',
      'Alojamiento: Upscale asegurado.',
      'Extras: Decode personalizado + 1 experiencia especial para el grupo.',
    ],
    closingLine: 'Más anécdotas que se vuelven leyenda compartida.',
    ctaLabel: 'Suban de nivel →',
  },
  bivouac: {
    title: 'Bivouac — Curaduría artesanal para tu tribu.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Hasta 5 noches.',
      'Transporte: Multimodal. Asientos y carry-on incluidos.',
      'Fechas: Sin bloqueos.',
      'Alojamiento: Upper-Upscale (diseño, boutique, stays con alma).',
      'Extras: Concierge Advisor + 1 experiencia premium para el grupo + perks.',
    ],
    closingLine: 'Conviértanse en tribu, no solo en grupo.',
    ctaLabel: 'Viajen distinto →',
  },
  atelier: {
    title: 'Atelier Getaway — Distinción, a medida (Crew Edition).',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    bullets: [
      'Duración: Customizable.',
      'Alojamiento: Luxury / de autor / cadenas A1.',
      'Extras: Co-creación con Luxury Travel Advisor + equipo 24/7.',
      'Incluye: 2+ experiencias premium a medida para celebrar juntos.',
      'Perks: Traslados privados, salas VIP, reservas prioritarias, amenidades exclusivas.',
    ],
    closingLine: 'La experiencia que vuelve inolvidable cualquier celebración.',
    ctaLabel: 'A un clic de lo extraordinario →',
  },
};

export const ALL_TIERS_CONTENT = {
  paws: PAWS_CONTENT,
  couple: COUPLE_CONTENT,
  honeymoon: HONEYMOON_CONTENT,
  solo: SOLO_CONTENT,
  family: FAMILY_CONTENT,
  group: GROUP_CONTENT,
};
