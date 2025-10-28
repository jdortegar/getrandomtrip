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
    description: 'Lo esencial con estilo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    features: [
      { title: 'Duración del viaje', description: 'Máximo 2 noches.' },
      { title: 'Destinos', description: 'Nacional (mismo país de origen).' },
      {
        title: 'Transporte',
        description:
          'Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos.',
      },
      { title: 'Alojamiento', description: 'Midscale (3★ o equivalentes).' },
      { title: 'Experiencias únicas', description: '—' },
      {
        title: 'Extras',
        description:
          'Una guía esencial pensada para explorar juntos sin apuros.',
      },
      {
        title: 'Destination Decoded',
        description: 'Pistas básicas para descubrir el destino.',
      },
    ],
    closingLine: 'Un escape breve para mirarse distinto.',
    ctaLabel: 'Reservar fácil →',
  },
  explora: {
    title: 'Modo Explora',
    description: 'Viaje activo y flexible.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    features: [
      { title: 'Duración del viaje', description: 'Hasta 3 noches.' },
      { title: 'Destinos', description: 'Nacional + países vecinos.' },
      {
        title: 'Transporte',
        description:
          'Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos.',
      },
      { title: 'Alojamiento', description: 'Mid-to-Upscale.' },
      { title: 'Experiencias únicas', description: '—' },
      {
        title: 'Extras',
        description: 'Recomendaciones locales y sorpresas pequeñas.',
      },
      {
        title: 'Destination Decoded',
        description:
          'Guía curada "Randomtrip Decode" con pistas para descubrir en pareja.',
      },
    ],
    closingLine: 'Para los que creen que enamorarse es perderse.',
    ctaLabel: 'Activen su modo →',
  },
  exploraPlus: {
    title: 'Explora+',
    description: 'Más capas, más detalles.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    features: [
      { title: 'Duración del viaje', description: 'Hasta 4 noches.' },
      { title: 'Destinos', description: 'Nacional + vecinos + región.' },
      {
        title: 'Transporte',
        description:
          'Multimodal. En vuelos: asientos, carry-on y bodega no incluidos.',
      },
      { title: 'Alojamiento', description: 'Upscale garantizado.' },
      {
        title: 'Experiencias únicas',
        description: '1 experiencia/actividad curada para dos.',
      },
      {
        title: 'Extras',
        description: 'Amenities locales y detalles especiales.',
      },
      {
        title: 'Destination Decoded',
        description: 'Decode personalizado con recomendaciones exclusivas.',
      },
    ],
    closingLine: 'Más excusas para coleccionar recuerdos a dos voces.',
    ctaLabel: 'Suban de nivel →',
  },
  bivouac: {
    title: 'Bivouac',
    description: 'Curaduría que se siente artesanal.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    features: [
      { title: 'Duración del viaje', description: 'Hasta 5 noches.' },
      { title: 'Destinos', description: 'Toda América (sin límites).' },
      {
        title: 'Transporte',
        description:
          'Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida.',
      },
      {
        title: 'Alojamiento',
        description: 'Upper-Upscale (diseño, boutique, experiencias locales).',
      },
      {
        title: 'Experiencias únicas',
        description: '1 experiencia Premium para compartir.',
      },
      {
        title: 'Extras',
        description:
          'Concierge Advisors + perks (early/late & upgrade sujetos a dispo).',
      },
      {
        title: 'Destination Decoded',
        description:
          'Guía artesanal con secretos locales y activaciones exclusivas.',
      },
    ],
    closingLine: 'Un viaje que se cuida como se cuida una relación.',
    ctaLabel: 'Viajen distinto →',
  },
  atelier: {
    title: 'Atelier Getaway',
    description: 'Distinción, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    features: [
      {
        title: 'Duración del viaje',
        description: 'Customizable (5+ noches recomendadas).',
      },
      { title: 'Destinos', description: 'Sin límites geográficos.' },
      {
        title: 'Transporte',
        description:
          'First class (priority boarding, lounge, asiento+carry-on+bodega incluidos).',
      },
      { title: 'Alojamiento', description: 'Luxury / de autor / cadenas A1.' },
      {
        title: 'Experiencias únicas',
        description: '2+ Experiencias Premium a medida, diseñadas para dos.',
      },
      {
        title: 'Extras',
        description:
          'Co-creación con Luxury Travel Advisor + equipo 24/7 + traslados privados + regalos.',
      },
      {
        title: 'Destination Decoded',
        description:
          'Curaduría completa con accesos VIP y experiencias irrepetibles.',
      },
    ],
    closingLine: 'Un lienzo en blanco para su historia.',
    ctaLabel: 'A un clic de lo extraordinario →',
  },
};

const PAWS_CONTENT = {
  essenza: {
    title: 'Essenza',
    description: 'Lo esencial, pet-friendly.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Máximo 2 noches.' },
      { title: 'Transporte', description: 'Low cost (cuando aplica).' },
      {
        title: 'Fechas',
        description: 'Disponibilidad acotada con restricciones.',
      },
      { title: 'Alojamiento', description: 'Midscale (3★ o equivalentes).' },
      {
        title: 'Extras',
        description: 'Guía esencial + tips para moverse con tu mascota.',
      },
    ],
    closingLine: 'Un escape simple donde tu mascota es parte del plan.',
    ctaLabel: 'Reservar fácil →',
  },
  explora: {
    title: 'Modo Explora',
    description: 'Activo y flexible (Pet Edition).',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Hasta 3 noches.' },
      {
        title: 'Transporte',
        description:
          'Multimodal; opciones amigables con mascotas donde sea posible.',
      },
      {
        title: 'Fechas',
        description: 'Buena disponibilidad; algunos bloqueos en feriados.',
      },
      { title: 'Alojamiento', description: 'Mid-to-Upscale pet-friendly.' },
      {
        title: 'Extras',
        description:
          'Randomtrip Decode con paseos y espacios dog/cat-friendly.',
      },
    ],
    closingLine: 'Senderos y rincones para descubrir juntos, sin estrés.',
    ctaLabel: 'Activen su modo →',
  },
  'explora-plus': {
    title: 'Explora+',
    description: 'Más días, más huellas.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Hasta 4 noches.' },
      { title: 'Transporte', description: 'Multimodal.' },
      {
        title: 'Fechas',
        description: 'Alta disponibilidad (con bloqueos festivos).',
      },
      {
        title: 'Alojamiento',
        description: 'Upscale asegurado, preferencia pet-friendly.',
      },
      {
        title: 'Extras',
        description: 'Decode personalizado + 1 experiencia curada para ambos.',
      },
    ],
    closingLine: 'Más juegos, más memoria compartida.',
    ctaLabel: 'Suban de nivel →',
  },
  bivouac: {
    title: 'Bivouac',
    description: 'Curaduría artesanal (Pet Edition).',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Hasta 5 noches.' },
      {
        title: 'Transporte',
        description: 'Multimodal (comodidad priorizada).',
      },
      { title: 'Fechas', description: 'Sin bloqueos.' },
      { title: 'Alojamiento', description: 'Upper-Upscale pet-friendly.' },
      {
        title: 'Extras',
        description:
          'Concierge Advisor + 1 experiencia premium con tu mascota + perks.',
      },
    ],
    closingLine: 'Un viaje pensado al detalle para los dos.',
    ctaLabel: 'Viajen distinto →',
  },
  atelier: {
    title: 'Atelier Getaway',
    description: 'Distinción, a medida (Pet Edition).',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Customizable.' },
      {
        title: 'Alojamiento',
        description: 'Luxury / de autor con protocolos pet-friendly.',
      },
      {
        title: 'Extras',
        description: 'Co-creación con Luxury Travel Advisor + 24/7.',
      },
      {
        title: 'Incluye',
        description: '2+ experiencias premium diseñadas para ambos.',
      },
      {
        title: 'Perks',
        description:
          'traslados privados, salas VIP (cuando aplica), reservas prioritarias.',
      },
    ],
    closingLine:
      'Cada momento, diseñado para vos y tu compañero de cuatro patas.',
    ctaLabel: 'A un clic de lo extraordinario →',
  },
};

const HONEYMOON_CONTENT = {
  atelier: {
    title: 'Atelier Getaway',
    description: 'Amor a medida',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.5)} USD`,
    priceFootnote: 'por persona · 💑 base doble',
    features: [
      { title: 'Duración', description: 'Customizable.' },
      { title: 'Alojamiento', description: 'Luxury / de autor / cadenas A1.' },
      {
        title: 'Extras',
        description: 'Co-creación con un Luxury Travel Advisor + equipo 24/7.',
      },
      {
        title: 'Incluye',
        description: '2+ experiencias premium diseñadas a medida.',
      },
      {
        title: 'Perks',
        description:
          'traslados privados, salas VIP, reservas prioritarias, regalos de marcas asociadas.',
      },
    ],
    closingLine:
      'Un lienzo en blanco para crear la luna de miel que no se repetirá jamás.',
    ctaLabel: 'Creen lo irrepetible →',
  },
};

const SOLO_CONTENT = {
  essenza: {
    title: 'Essenza',
    description: 'Lo esencial con estilo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Máximo 2 noches.' },
      {
        title: 'Transporte',
        description:
          'Low cost (buses o vuelos off-peak). Asiento garantizado, carry-on opcional.',
      },
      {
        title: 'Fechas',
        description: 'Menor disponibilidad; con restricciones.',
      },
      { title: 'Alojamiento', description: 'Midscale (3★ o equivalentes).' },
      {
        title: 'Extras',
        description:
          'Una guía esencial pensada para que explores a tu manera, sin apuro.',
      },
    ],
    closingLine: 'Un escape breve para perderte en lo simple y encontrarte.',
    ctaLabel: 'Reservá fácil →',
  },
  explora: {
    title: 'Modo Explora',
    description: 'Viaje activo y flexible.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Hasta 3 noches.' },
      {
        title: 'Transporte',
        description:
          'Multimodal. En vuelos: asiento garantizado, carry-on opcional.',
      },
      {
        title: 'Fechas',
        description: 'Mayor disponibilidad, con algunos bloqueos en feriados.',
      },
      { title: 'Alojamiento', description: 'Mid-to-Upscale.' },
      {
        title: 'Extras',
        description:
          '"Randomtrip Decode" con pistas para abrirte camino a tu aire.',
      },
    ],
    closingLine: 'Diseñado para descubrir a tu propio ritmo.',
    ctaLabel: 'Activá tu modo →',
  },
  'explora-plus': {
    title: 'Explora+',
    description: 'Más capas, más descubrimientos.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Hasta 4 noches.' },
      {
        title: 'Transporte',
        description:
          'Multimodal. En vuelos: asiento garantizado, carry-on opcional.',
      },
      {
        title: 'Fechas',
        description:
          'Alta disponibilidad, incluso en feriados (con bloqueos festivos).',
      },
      { title: 'Alojamiento', description: 'Upscale asegurado.' },
      {
        title: 'Extras',
        description:
          'Decode personalizado + 1 experiencia curada solo para vos.',
      },
    ],
    closingLine:
      'Más noches, más encuentros, más razones para volver distinto.',
    ctaLabel: 'Subí de nivel →',
  },
  bivouac: {
    title: 'Bivouac',
    description: 'Curaduría que se siente artesanal.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'Hasta 5 noches.' },
      {
        title: 'Transporte',
        description: 'Multimodal. En vuelos: asiento y carry-on incluidos.',
      },
      { title: 'Fechas', description: 'Sin bloqueos.' },
      {
        title: 'Alojamiento',
        description: 'Upper-Upscale (boutique, diseño, experiencias locales).',
      },
      {
        title: 'Extras',
        description:
          'Concierge Advisor + 1 experiencia premium + perks (early/late & upgrade sujetos a dispo).',
      },
    ],
    closingLine:
      'Un viaje cuidado, íntimo y con detalles que marcan la diferencia.',
    ctaLabel: 'Viajá distinto →',
  },
  atelier: {
    title: 'Atelier Getaway',
    description: 'Distinción, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      { title: 'Duración', description: 'A medida.' },
      { title: 'Alojamiento', description: 'Luxury / de autor / cadenas A1.' },
      {
        title: 'Extras',
        description: 'Co-creación con un Luxury Travel Advisor + equipo 24/7.',
      },
      { title: 'Incluye', description: '2+ experiencias premium a medida.' },
      {
        title: 'Perks',
        description:
          'traslados privados, salas VIP, reservas prioritarias, regalos de marcas asociadas.',
      },
    ],
    closingLine:
      'El lujo de viajar sin testigos, con experiencias confidenciales.',
    ctaLabel: 'A un clic de lo impredecible →',
  },
};

const FAMILY_CONTENT = {
  essenza: {
    title: 'Essenza',
    description: 'Lo esencial, compartido.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Máximo 2 noches.' },
      {
        title: 'Transporte',
        description: 'Low cost. Asientos, carry-on y bodega no incluidos.',
      },
      {
        title: 'Fechas',
        description: 'Menor disponibilidad, con restricciones y bloqueos.',
      },
      { title: 'Alojamiento', description: 'Midscale (3★ o equivalentes).' },
      {
        title: 'Extras',
        description:
          'Guía esencial para que el grupo disfrute sin complicaciones.',
      },
    ],
    closingLine: 'Un par de días que se contarán en la sobremesa.',
    ctaLabel: 'Activen su Essenza →',
  },
  explora: {
    title: 'Modo Explora',
    description: 'Activo y flexible, en equipo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Hasta 3 noches.' },
      {
        title: 'Transporte',
        description: 'Multimodal. Asientos, carry-on y bodega no incluidos.',
      },
      {
        title: 'Fechas',
        description: 'Mayor disponibilidad; algunos bloqueos en feriados.',
      },
      { title: 'Alojamiento', description: 'Mid-to-Upscale.' },
      {
        title: 'Extras',
        description: 'Randomtrip Decode con pistas para descubrir en grupo.',
      },
    ],
    closingLine: 'Planes que sorprenden a grandes y chicos.',
    ctaLabel: 'Activen su Modo Explora →',
  },
  exploraPlus: {
    title: 'Explora+',
    description: 'Más capas, más momentos (en plural).',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Hasta 4 noches.' },
      {
        title: 'Transporte',
        description: 'Multimodal. Asientos, carry-on y bodega no incluidos.',
      },
      {
        title: 'Fechas',
        description: 'Alta disponibilidad, incluso en feriados.',
      },
      { title: 'Alojamiento', description: 'Upscale asegurado.' },
      {
        title: 'Extras',
        description:
          'Decode personalizado + 1 experiencia curada para el grupo.',
      },
    ],
    closingLine: 'Más días, más juegos, más historias que se heredan.',
    ctaLabel: 'Suban de nivel con Explora+ →',
  },
  bivouac: {
    title: 'Bivouac',
    description: 'Curaduría artesanal para su tribu.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Hasta 5 noches.' },
      {
        title: 'Transporte',
        description: 'Multimodal. Asientos y carry-on incluidos.',
      },
      { title: 'Fechas', description: 'Sin bloqueos.' },
      {
        title: 'Alojamiento',
        description: 'Upper-Upscale (boutique, diseño, stays con alma).',
      },
      {
        title: 'Extras',
        description:
          'Concierge Advisor + 1 experiencia premium para el grupo + perks.',
      },
    ],
    closingLine: 'Donde cada miembro de la familia encuentra su lugar.',
    ctaLabel: 'Viajen distinto con Bivouac →',
  },
  atelier: {
    title: 'Atelier Getaway',
    description: 'Distinción, a medida (Family Edition).',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Customizable.' },
      { title: 'Alojamiento', description: 'Luxury / de autor / cadenas A1.' },
      {
        title: 'Extras',
        description: 'Co-creación con un Luxury Travel Advisor + equipo 24/7.',
      },
      {
        title: 'Incluye',
        description: '2+ experiencias premium diseñadas a la medida del grupo.',
      },
      {
        title: 'Perks',
        description:
          'Traslados privados, salas VIP, reservas prioritarias, atenciones especiales.',
      },
    ],
    closingLine:
      'Una experiencia donde la familia entera viaja como protagonista.',
    ctaLabel: 'A un clic de lo extraordinario →',
  },
};

const GROUP_CONTENT = {
  essenza: {
    title: 'Essenza',
    description: 'Lo esencial para sincronizar agendas.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Máximo 2 noches.' },
      {
        title: 'Transporte',
        description: 'Low cost. Asientos, carry-on y bodega no incluidos.',
      },
      {
        title: 'Fechas',
        description: 'Menor disponibilidad, con restricciones y bloqueos.',
      },
      { title: 'Alojamiento', description: 'Midscale (3★ o equivalentes).' },
      {
        title: 'Extras',
        description:
          'Guía esencial con planes simples para disfrutar en grupo.',
      },
    ],
    closingLine: 'Una escapada simple para reírse juntos otra vez.',
    ctaLabel: 'Reservar fácil →',
  },
  explora: {
    title: 'Modo Explora',
    description: 'Activo y flexible para el grupo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Hasta 3 noches.' },
      {
        title: 'Transporte',
        description: 'Multimodal. Asientos, carry-on y bodega no incluidos.',
      },
      {
        title: 'Fechas',
        description: 'Mayor disponibilidad; algunos bloqueos en feriados.',
      },
      { title: 'Alojamiento', description: 'Mid-to-Upscale.' },
      {
        title: 'Extras',
        description:
          'Randomtrip Decode con pistas + actividades que admiten distintos ritmos.',
      },
    ],
    closingLine: 'Planes flexibles que se adaptan a todos.',
    ctaLabel: 'Activen su modo →',
  },
  exploraPlus: {
    title: 'Explora+',
    description: 'Más noches, más brindis.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Hasta 4 noches.' },
      {
        title: 'Transporte',
        description: 'Multimodal. Asientos, carry-on y bodega no incluidos.',
      },
      {
        title: 'Fechas',
        description: 'Alta disponibilidad, incluso feriados.',
      },
      { title: 'Alojamiento', description: 'Upscale asegurado.' },
      {
        title: 'Extras',
        description:
          'Decode personalizado + 1 experiencia especial para el grupo.',
      },
    ],
    closingLine: 'Más anécdotas que se vuelven leyenda compartida.',
    ctaLabel: 'Suban de nivel →',
  },
  bivouac: {
    title: 'Bivouac',
    description: 'Curaduría artesanal para tu tribu.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Hasta 5 noches.' },
      {
        title: 'Transporte',
        description: 'Multimodal. Asientos y carry-on incluidos.',
      },
      { title: 'Fechas', description: 'Sin bloqueos.' },
      {
        title: 'Alojamiento',
        description: 'Upper-Upscale (diseño, boutique, stays con alma).',
      },
      {
        title: 'Extras',
        description:
          'Concierge Advisor + 1 experiencia premium para el grupo + perks.',
      },
    ],
    closingLine: 'Conviértanse en tribu, no solo en grupo.',
    ctaLabel: 'Viajen distinto →',
  },
  atelier: {
    title: 'Atelier Getaway',
    description: 'Distinción, a medida (Crew Edition).',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona · 👥 base grupo',
    features: [
      { title: 'Duración', description: 'Customizable.' },
      { title: 'Alojamiento', description: 'Luxury / de autor / cadenas A1.' },
      {
        title: 'Extras',
        description: 'Co-creación con Luxury Travel Advisor + equipo 24/7.',
      },
      {
        title: 'Incluye',
        description: '2+ experiencias premium a medida para celebrar juntos.',
      },
      {
        title: 'Perks',
        description:
          'Traslados privados, salas VIP, reservas prioritarias, amenidades exclusivas.',
      },
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
