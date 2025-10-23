/**
 * =================================================================
 *  Sistema Unificado de Niveles de Experiencia Randomtrip
 * =================================================================
 *
 * Estructura refactorizada con propiedades explícitas
 *
 * Reglas de Precios:
 * - Base: Precios estándar por persona.
 * - Solo & Paws: +30% sobre el precio base.
 * - Honeymoon: +50% sobre el precio base.
 *
 * Niveles Disponibles:
 * - Essenza: Lo esencial
 * - Modo Explora: Activo y flexible
 * - Explora+: Más capas
 * - Bivouac: Curaduría artesanal
 * - Atelier Getaway: Distinción y lujo
 */

// ============================================================================
// Types
// ============================================================================

export interface LevelFeature {
  key: string;
  label: string;
  content: string;
}

export interface LevelContent {
  title: string;
  subtitle: string;
  priceLabel: string;
  priceFootnote: string;
  features: LevelFeature[];
  closingLine: string;
  ctaLabel: string;
}

// ============================================================================
// Constants
// ============================================================================

export const BASE_PRICES = {
  essenza: 350,
  explora: 500,
  exploraPlus: 850,
  bivouac: 1200,
  atelier: 1200,
};

// No longer needed - categories are in each feature
// export const LEVEL_CATEGORIES = [...];

// ============================================================================
// Helpers
// ============================================================================

const calculatePrice = (basePrice: number, multiplier = 1): number => {
  const increasedPrice = basePrice * multiplier;
  return Math.round(increasedPrice / 10) * 10;
};

// ============================================================================
// COUPLE Levels
// ============================================================================

const COUPLE_LEVELS = {
  essenza: {
    title: 'Essenza',
    subtitle: 'Lo esencial con estilo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona · base doble',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Máximo 2 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional (mismo país de origen)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Midscale (3★ o equivalentes)',
      },
      { key: 'experienciasUnicas', label: 'Experiencias únicas', content: '—' },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Una guía esencial pensada para explorar juntos sin apuros',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content: 'Pistas básicas para descubrir el destino',
      },
    ],
    closingLine: 'Un escape breve para mirarse distinto.',
    ctaLabel: 'Reservar fácil',
  },
  explora: {
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona · base doble',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 3 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional + países vecinos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      { key: 'alojamiento', label: 'Alojamiento', content: 'Mid-to-Upscale' },
      { key: 'experienciasUnicas', label: 'Experiencias únicas', content: '—' },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Recomendaciones locales y sorpresas pequeñas',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía curada "Randomtrip Decode" con pistas para descubrir en pareja',
      },
    ],
    closingLine: 'Para los que creen que enamorarse es perderse.',
    ctaLabel: 'Activen su modo',
  },
  exploraPlus: {
    title: 'Explora+',
    subtitle: 'Más capas, más detalles.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona · base doble',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 4 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional + vecinos + región',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Upscale garantizado',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '1 experiencia/actividad curada para dos',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Amenities locales y detalles especiales',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content: 'Decode personalizado con recomendaciones exclusivas',
      },
    ],
    closingLine: 'Más excusas para coleccionar recuerdos a dos voces.',
    ctaLabel: 'Suban de nivel',
  },
  bivouac: {
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona · base doble',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 5 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Toda América (sin límites)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Upper-Upscale (diseño, boutique, experiencias locales)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '1 experiencia Premium para compartir',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Concierge Advisors + perks (early/late & upgrade sujetos a dispo)',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía artesanal con secretos locales y activaciones exclusivas',
      },
    ],
    closingLine: 'Un viaje que se cuida como se cuida una relación.',
    ctaLabel: 'Viajen distinto',
  },
  atelier: {
    title: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona · base doble',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Customizable (5+ noches recomendadas)',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Sin límites geográficos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'First class (priority boarding, lounge, asiento+carry-on+bodega incluidos)',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Luxury / de autor / cadenas A1',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '2+ Experiencias Premium a medida, diseñadas para dos',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Co-creación con Luxury Travel Advisor + equipo 24/7 + traslados privados + regalos',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Curaduría completa con accesos VIP y experiencias irrepetibles',
      },
    ],
    closingLine: 'Un lienzo en blanco para su historia.',
    ctaLabel: 'A un clic de lo extraordinario',
  },
};

// ============================================================================
// Export All Levels
// ============================================================================

// ============================================================================
// SOLO Levels
// ============================================================================

const SOLO_LEVELS = {
  essenza: {
    title: 'Essenza',
    subtitle: 'Lo esencial para tu aventura.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Máximo 2 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional (mismo país de origen)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Midscale (3★ o equivalentes)',
      },
      { key: 'experienciasUnicas', label: 'Experiencias únicas', content: '—' },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Una guía esencial para explorar en solitario',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content: 'Pistas básicas para descubrir el destino',
      },
    ],
    closingLine: 'Un escape breve para reconectar contigo mismo.',
    ctaLabel: 'Reservar fácil',
  },
  explora: {
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 3 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional + países vecinos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      { key: 'alojamiento', label: 'Alojamiento', content: 'Mid-to-Upscale' },
      { key: 'experienciasUnicas', label: 'Experiencias únicas', content: '—' },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Recomendaciones locales y sorpresas pequeñas',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía curada "Randomtrip Decode" con pistas para descubrir solo',
      },
    ],
    closingLine: 'Para los que creen que viajar solo es encontrarse.',
    ctaLabel: 'Activa tu modo',
  },
  exploraPlus: {
    title: 'Explora+',
    subtitle: 'Más capas, más detalles.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 4 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional + vecinos + región',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Upscale garantizado',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '1 experiencia/actividad curada para ti',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Amenities locales y detalles especiales',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content: 'Decode personalizado con recomendaciones exclusivas',
      },
    ],
    closingLine: 'Más excusas para coleccionar recuerdos únicos.',
    ctaLabel: 'Sube de nivel',
  },
  bivouac: {
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 5 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Toda América (sin límites)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Upper-Upscale (diseño, boutique, experiencias locales)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '1 experiencia Premium para ti',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Concierge Advisors + perks (early/late & upgrade sujetos a dispo)',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía artesanal con secretos locales y activaciones exclusivas',
      },
    ],
    closingLine: 'Un viaje que se cuida como se cuida la soledad elegida.',
    ctaLabel: 'Viaja distinto',
  },
  atelier: {
    title: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Customizable (5+ noches recomendadas)',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Sin límites geográficos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'First class (priority boarding, lounge, asiento+carry-on+bodega incluidos)',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Luxury / de autor / cadenas A1',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '2+ Experiencias Premium a medida, diseñadas para ti',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Co-creación con Luxury Travel Advisor + equipo 24/7 + traslados privados + regalos',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Curaduría completa con accesos VIP y experiencias irrepetibles',
      },
    ],
    closingLine: 'Un lienzo en blanco para tu historia.',
    ctaLabel: 'A un clic de lo extraordinario',
  },
};

// ============================================================================
// FAMILY Levels
// ============================================================================

const FAMILY_LEVELS = {
  essenza: {
    title: 'Essenza',
    subtitle: 'Lo esencial para la familia.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Máximo 2 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional (mismo país de origen)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Midscale (3★ o equivalentes)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias familiares',
        content: '—',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Una guía esencial pensada para toda la familia',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content: 'Pistas básicas para descubrir el destino en familia',
      },
    ],
    closingLine: 'Un escape breve para reconectar en familia.',
    ctaLabel: 'Reservar fácil',
  },
  explora: {
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible para toda la familia.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 3 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional + países vecinos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      { key: 'alojamiento', label: 'Alojamiento', content: 'Mid-to-Upscale' },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias familiares',
        content: '—',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Recomendaciones locales y sorpresas para toda la familia',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía curada "Randomtrip Decode" con pistas para descubrir en familia',
      },
    ],
    closingLine:
      'Para las familias que creen que viajar juntos es crecer juntos.',
    ctaLabel: 'Activen su modo',
  },
  exploraPlus: {
    title: 'Explora+',
    subtitle: 'Más capas, más detalles familiares.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 4 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional + vecinos + región',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Upscale garantizado',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias familiares',
        content: '1 experiencia/actividad curada para toda la familia',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Amenities locales y detalles especiales para familias',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Decode personalizado con recomendaciones exclusivas para familias',
      },
    ],
    closingLine: 'Más excusas para coleccionar recuerdos familiares únicos.',
    ctaLabel: 'Suban de nivel',
  },
  bivouac: {
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal para familias.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 5 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Toda América (sin límites)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Upper-Upscale (diseño, boutique, experiencias locales)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias familiares',
        content: '1 experiencia Premium para toda la familia',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Concierge Advisors + perks familiares (early/late & upgrade sujetos a dispo)',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía artesanal con secretos locales y activaciones exclusivas para familias',
      },
    ],
    closingLine: 'Un viaje que se cuida como se cuida una familia.',
    ctaLabel: 'Viajen distinto',
  },
  atelier: {
    title: 'Atelier Getaway',
    subtitle: 'Distinción familiar, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Customizable (5+ noches recomendadas)',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Sin límites geográficos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'First class (priority boarding, lounge, asiento+carry-on+bodega incluidos)',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Luxury / de autor / cadenas A1',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias familiares',
        content:
          '2+ Experiencias Premium a medida, diseñadas para toda la familia',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Co-creación con Luxury Travel Advisor + equipo 24/7 + traslados privados + regalos familiares',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Curaduría completa con accesos VIP y experiencias irrepetibles para familias',
      },
    ],
    closingLine: 'Un lienzo en blanco para su historia familiar.',
    ctaLabel: 'A un clic de lo extraordinario',
  },
};

// ============================================================================
// GROUP Levels
// ============================================================================

const GROUP_LEVELS = {
  essenza: {
    title: 'Essenza',
    subtitle: 'Lo esencial para el grupo.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Máximo 2 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional (mismo país de origen)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Midscale (3★ o equivalentes)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias grupales',
        content: '—',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Una guía esencial pensada para grupos',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content: 'Pistas básicas para descubrir el destino en grupo',
      },
    ],
    closingLine: 'Un escape breve para reconectar con amigos.',
    ctaLabel: 'Reservar fácil',
  },
  explora: {
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible para grupos.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 3 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional + países vecinos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      { key: 'alojamiento', label: 'Alojamiento', content: 'Mid-to-Upscale' },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias grupales',
        content: '—',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Recomendaciones locales y sorpresas para grupos',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía curada "Randomtrip Decode" con pistas para descubrir en grupo',
      },
    ],
    closingLine:
      'Para los grupos que creen que viajar juntos es celebrar juntos.',
    ctaLabel: 'Activen su modo',
  },
  exploraPlus: {
    title: 'Explora+',
    subtitle: 'Más capas, más detalles grupales.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 4 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Nacional + vecinos + región',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Upscale garantizado',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias grupales',
        content: '1 experiencia/actividad curada para el grupo',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Amenities locales y detalles especiales para grupos',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Decode personalizado con recomendaciones exclusivas para grupos',
      },
    ],
    closingLine: 'Más excusas para coleccionar recuerdos grupales únicos.',
    ctaLabel: 'Suban de nivel',
  },
  bivouac: {
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal para grupos.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 5 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Toda América (sin límites)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Upper-Upscale (diseño, boutique, experiencias locales)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias grupales',
        content: '1 experiencia Premium para el grupo',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Concierge Advisors + perks grupales (early/late & upgrade sujetos a dispo)',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía artesanal con secretos locales y activaciones exclusivas para grupos',
      },
    ],
    closingLine: 'Un viaje que se cuida como se cuida una amistad.',
    ctaLabel: 'Viajen distinto',
  },
  atelier: {
    title: 'Atelier Getaway',
    subtitle: 'Distinción grupal, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Customizable (5+ noches recomendadas)',
      },
      {
        key: 'destinos',
        label: 'Destinos',
        content: 'Sin límites geográficos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'First class (priority boarding, lounge, asiento+carry-on+bodega incluidos)',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento',
        content: 'Luxury / de autor / cadenas A1',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias grupales',
        content: '2+ Experiencias Premium a medida, diseñadas para el grupo',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Co-creación con Luxury Travel Advisor + equipo 24/7 + traslados privados + regalos grupales',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Curaduría completa con accesos VIP y experiencias irrepetibles para grupos',
      },
    ],
    closingLine: 'Un lienzo en blanco para su historia grupal.',
    ctaLabel: 'A un clic de lo extraordinario',
  },
};

// ============================================================================
// HONEYMOON Levels
// ============================================================================

const HONEYMOON_LEVELS = {
  essenza: {
    title: 'Essenza',
    subtitle: 'Lo esencial para su luna de miel.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza, 1.5)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Máximo 2 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos románticos',
        content: 'Nacional (mismo país de origen)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento especial',
        content: 'Midscale (3★ o equivalentes)',
      },
      { key: 'experienciasUnicas', label: 'Experiencias únicas', content: '—' },
      {
        key: 'extras',
        label: 'Extras románticos',
        content: 'Una guía esencial pensada para parejas',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content: 'Pistas básicas para descubrir el destino en pareja',
      },
    ],
    closingLine: 'Un escape breve para comenzar su vida juntos.',
    ctaLabel: 'Reservar fácil',
  },
  explora: {
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible para su luna de miel.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora, 1.5)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 3 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos románticos',
        content: 'Nacional + países vecinos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento especial',
        content: 'Mid-to-Upscale',
      },
      { key: 'experienciasUnicas', label: 'Experiencias únicas', content: '—' },
      {
        key: 'extras',
        label: 'Extras románticos',
        content: 'Recomendaciones locales y sorpresas románticas',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía curada "Randomtrip Decode" con pistas para descubrir en pareja',
      },
    ],
    closingLine:
      'Para las parejas que creen que enamorarse es perderse juntos.',
    ctaLabel: 'Activen su modo',
  },
  exploraPlus: {
    title: 'Explora+',
    subtitle: 'Más capas, más detalles románticos.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus, 1.5)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 4 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos románticos',
        content: 'Nacional + vecinos + región',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento especial',
        content: 'Upscale garantizado',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '1 experiencia/actividad curada para dos',
      },
      {
        key: 'extras',
        label: 'Extras románticos',
        content: 'Amenities locales y detalles especiales románticos',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Decode personalizado con recomendaciones exclusivas románticas',
      },
    ],
    closingLine: 'Más excusas para coleccionar recuerdos románticos únicos.',
    ctaLabel: 'Suban de nivel',
  },
  bivouac: {
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal para su luna de miel.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac, 1.5)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 5 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos románticos',
        content: 'Toda América (sin límites)',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento especial',
        content: 'Upper-Upscale (diseño, boutique, experiencias locales)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '1 experiencia Premium para dos',
      },
      {
        key: 'extras',
        label: 'Extras románticos',
        content:
          'Concierge Advisors + perks románticos (early/late & upgrade sujetos a dispo)',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía artesanal con secretos locales y activaciones exclusivas románticas',
      },
    ],
    closingLine: 'Un viaje que se cuida como se cuida el amor.',
    ctaLabel: 'Viajen distinto',
  },
  atelier: {
    title: 'Atelier Getaway',
    subtitle: 'Distinción romántica, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.5)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Customizable (5+ noches recomendadas)',
      },
      {
        key: 'destinos',
        label: 'Destinos románticos',
        content: 'Sin límites geográficos',
      },
      {
        key: 'transporte',
        label: 'Transporte',
        content:
          'First class (priority boarding, lounge, asiento+carry-on+bodega incluidos)',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento especial',
        content: 'Luxury / de autor / cadenas A1',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias únicas',
        content: '2+ Experiencias Premium a medida, diseñadas para dos',
      },
      {
        key: 'extras',
        label: 'Extras románticos',
        content:
          'Co-creación con Luxury Travel Advisor + equipo 24/7 + traslados privados + regalos románticos',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Curaduría completa con accesos VIP y experiencias irrepetibles románticas',
      },
    ],
    closingLine: 'Un lienzo en blanco para su historia de amor.',
    ctaLabel: 'A un clic de lo extraordinario',
  },
};

// ============================================================================
// PAWS Levels
// ============================================================================

const PAWS_LEVELS = {
  essenza: {
    title: 'Essenza',
    subtitle: 'Lo esencial para viajar con tu mascota.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.essenza, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Máximo 2 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos pet-friendly',
        content: 'Nacional (mismo país de origen)',
      },
      {
        key: 'transporte',
        label: 'Transporte apto mascotas',
        content:
          'Low cost (buses o vuelos off-peak). Asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento pet-friendly',
        content: 'Midscale (3★ o equivalentes)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias con mascotas',
        content: '—',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Una guía esencial pensada para viajar con mascotas',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content: 'Pistas básicas para descubrir el destino con tu mascota',
      },
    ],
    closingLine: 'Un escape breve para reconectar con tu mejor amigo.',
    ctaLabel: 'Reservar fácil',
  },
  explora: {
    title: 'Modo Explora',
    subtitle: 'Viaje activo y flexible con tu mascota.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.explora, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 3 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos pet-friendly',
        content: 'Nacional + países vecinos',
      },
      {
        key: 'transporte',
        label: 'Transporte apto mascotas',
        content:
          'Multimodal, horarios más flexibles. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento pet-friendly',
        content: 'Mid-to-Upscale',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias con mascotas',
        content: '—',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Recomendaciones locales y sorpresas para mascotas',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía curada "Randomtrip Decode" con pistas para descubrir con tu mascota',
      },
    ],
    closingLine:
      'Para los que creen que viajar con mascotas es compartir aventuras.',
    ctaLabel: 'Activa tu modo',
  },
  exploraPlus: {
    title: 'Explora+',
    subtitle: 'Más capas, más detalles para mascotas.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.exploraPlus, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 4 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos pet-friendly',
        content: 'Nacional + vecinos + región',
      },
      {
        key: 'transporte',
        label: 'Transporte apto mascotas',
        content:
          'Multimodal. En vuelos: asientos, carry-on y bodega no incluidos',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento pet-friendly',
        content: 'Upscale garantizado',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias con mascotas',
        content: '1 experiencia/actividad curada para ti y tu mascota',
      },
      {
        key: 'extras',
        label: 'Extras',
        content: 'Amenities locales y detalles especiales para mascotas',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Decode personalizado con recomendaciones exclusivas para mascotas',
      },
    ],
    closingLine: 'Más excusas para coleccionar recuerdos con tu mascota.',
    ctaLabel: 'Sube de nivel',
  },
  bivouac: {
    title: 'Bivouac',
    subtitle: 'Curaduría que se siente artesanal para mascotas.',
    priceLabel: `Hasta ${calculatePrice(BASE_PRICES.bivouac, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Hasta 5 noches',
      },
      {
        key: 'destinos',
        label: 'Destinos pet-friendly',
        content: 'Toda América (sin límites)',
      },
      {
        key: 'transporte',
        label: 'Transporte apto mascotas',
        content:
          'Multimodal. En vuelos: asientos y carry-on incluidos; bodega no incluida',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento pet-friendly',
        content: 'Upper-Upscale (diseño, boutique, experiencias locales)',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias con mascotas',
        content: '1 experiencia Premium para ti y tu mascota',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Concierge Advisors + perks para mascotas (early/late & upgrade sujetos a dispo)',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Guía artesanal con secretos locales y activaciones exclusivas para mascotas',
      },
    ],
    closingLine: 'Un viaje que se cuida como se cuida a tu mascota.',
    ctaLabel: 'Viaja distinto',
  },
  atelier: {
    title: 'Atelier Getaway',
    subtitle: 'Distinción para mascotas, sin esfuerzo.',
    priceLabel: `Desde ${calculatePrice(BASE_PRICES.atelier, 1.3)} USD`,
    priceFootnote: 'por persona',
    features: [
      {
        key: 'duracion',
        label: 'Duración del viaje',
        content: 'Customizable (5+ noches recomendadas)',
      },
      {
        key: 'destinos',
        label: 'Destinos pet-friendly',
        content: 'Sin límites geográficos',
      },
      {
        key: 'transporte',
        label: 'Transporte apto mascotas',
        content:
          'First class (priority boarding, lounge, asiento+carry-on+bodega incluidos)',
      },
      {
        key: 'alojamiento',
        label: 'Alojamiento pet-friendly',
        content: 'Luxury / de autor / cadenas A1',
      },
      {
        key: 'experienciasUnicas',
        label: 'Experiencias con mascotas',
        content:
          '2+ Experiencias Premium a medida, diseñadas para ti y tu mascota',
      },
      {
        key: 'extras',
        label: 'Extras',
        content:
          'Co-creación con Luxury Travel Advisor + equipo 24/7 + traslados privados + regalos para mascotas',
      },
      {
        key: 'destinationDecoded',
        label: 'Destination Decoded',
        content:
          'Curaduría completa con accesos VIP y experiencias irrepetibles para mascotas',
      },
    ],
    closingLine: 'Un lienzo en blanco para tu historia con tu mascota.',
    ctaLabel: 'A un clic de lo extraordinario',
  },
};

export const ALL_LEVELS = {
  couple: COUPLE_LEVELS,
  solo: SOLO_LEVELS,
  family: FAMILY_LEVELS,
  group: GROUP_LEVELS,
  honeymoon: HONEYMOON_LEVELS,
  paws: PAWS_LEVELS,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert to legacy bullet format (backwards compatibility)
 */
export function convertLevelToLegacyBullets(level: LevelContent): string[] {
  return level.features.map(({ label, content }) => `${label}: ${content}`);
}

/**
 * Get all category labels from features
 */
export function getCategoryLabels(level: LevelContent): string[] {
  return level.features.map((f) => f.label);
}

/**
 * Get feature content by key
 */
export function getFeatureContent(level: LevelContent, key: string): string {
  const feature = level.features.find((f) => f.key === key);
  return feature?.content || '—';
}

/**
 * Get level by traveler type and level ID
 */
export function getLevel(
  travelerType: string,
  levelId: string,
): LevelContent | null {
  const typeLevels = ALL_LEVELS[travelerType as keyof typeof ALL_LEVELS];
  if (!typeLevels) return null;

  return typeLevels[levelId as keyof typeof typeLevels] || null;
}
