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

export const ALL_LEVELS = {
  couple: COUPLE_LEVELS,
  // TODO: Add solo, family, group, honeymoon, paws
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
