/**
 * Unified experience levels – single source for level content (duration, destination,
 * transport, accommodation, benefit, copy) by traveler type and level.
 * Pricing: @/lib/data/traveler-types (getBasePricePerPerson).
 * NUPTIA (honeymoon): only atelier, "Honeymoon Edition", 1800 USD.
 */

import type { TravelerTypeSlug } from '@/lib/data/traveler-types';
import type { Locale } from '@/lib/i18n/config';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { hasLocale } from '@/lib/i18n/config';

/** Level id used in this module (aligns with PriceLevelId in traveler-types). */
export type ExperienceLevelId =
  | 'essenza'
  | 'explora'
  | 'explora-plus'
  | 'bivouac'
  | 'atelier';

/** Map planner/URL level id to ExperienceLevelId. */
export function normalizeExperienceLevelId(
  levelId: string | null | undefined,
): ExperienceLevelId | null {
  if (!levelId) return null;
  const n = levelId
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace('explora+', 'explora-plus');
  if (n === 'exploraplus') return 'explora-plus';
  if (n === 'modoexplora' || n === 'modo-explora' || n === 'explora')
    return 'explora';
  if (n === 'atelier-getaway' || n === 'atelier') return 'atelier';
  if (n === 'essenza' || n === 'explora-plus' || n === 'bivouac')
    return n as ExperienceLevelId;
  return null;
}

export interface LevelFeature {
  title: string;
  description: string;
  footnote?: string;
}

/** Level content (no price nor excuses – those come from traveler-types and excuse-helper). */
export interface ExperienceLevelContent {
  ctaLabel: string;
  closingLine: string;
  features: LevelFeature[];
  id: ExperienceLevelId;
  maxNights: number;
  name: string;
  subtitle: string;
}

/** Planner section header (title, subtitle, optional eyebrow) per type and locale. Single source for TypePlanner content. */
export interface PlannerHeader {
  eyebrow?: string;
  subtitle: string;
  title: string;
}

const PLANNER_HEADERS: Record<
  TravelerTypeSlug,
  Record<Locale, PlannerHeader>
> = {
  couple: {
    es: {
      title: 'Diseñen su Randomtrip en pareja',
      subtitle:
        'Tres pasos sencillos para vivir una historia que nadie más podrá contar.',
    },
    en: {
      title: 'Design your Randomtrip as a couple',
      subtitle:
        'Three simple steps to live a story no one else will be able to tell.',
    },
  },
  solo: {
    es: {
      eyebrow: 'Diseña tu Randomtrip en solitario',
      title: 'tres pasos sencillos',
      subtitle: 'para una aventura que solo tú podrás contar.',
    },
    en: {
      eyebrow: 'Design your solo Randomtrip',
      title: 'three simple steps',
      subtitle: 'for an adventure only you will be able to tell.',
    },
  },
  family: {
    es: {
      title: 'Diseñen su Randomtrip en familia',
      subtitle:
        '3 pasos cortos, para que comencemos a crear la mejor experiencia.',
    },
    en: {
      title: 'Design your family Randomtrip',
      subtitle: '3 short steps so we can start creating the best experience.',
    },
  },
  group: {
    es: {
      title: 'De amigos a equipos: diseñen su Randomtrip',
      subtitle: 'Pasos cortos, para crear la mejor experiencia grupal.',
    },
    en: {
      title: 'From friends to teams: design your Randomtrip',
      subtitle: 'Short steps to create the best group experience.',
    },
  },
  honeymoon: {
    es: {
      title: 'Diseñen su Honeymoon Randomtrip',
      subtitle: 'Tres pasos para comenzar su vida juntos de la mejor manera.',
    },
    en: {
      title: 'Design your Honeymoon Randomtrip',
      subtitle: 'Three steps to start your life together in the best way.',
    },
  },
  paws: {
    es: {
      title: 'Diseñen su PAWS Randomtrip',
      subtitle:
        'Tres pasos sencillos para una aventura donde tu mascota es protagonista.',
    },
    en: {
      title: 'Design your PAWS Randomtrip',
      subtitle: 'Three simple steps for an adventure where your pet is the star.',
    },
  },
};

/** Honeymoon (NUPTIA) only has Atelier. */
const LEVEL_IDS_BY_TYPE: Record<TravelerTypeSlug, readonly ExperienceLevelId[]> = {
  couple: ['essenza', 'explora', 'explora-plus', 'bivouac', 'atelier'],
  family: ['essenza', 'explora', 'explora-plus', 'bivouac', 'atelier'],
  group: ['essenza', 'explora', 'explora-plus', 'bivouac', 'atelier'],
  honeymoon: ['atelier'],
  paws: ['essenza', 'explora', 'explora-plus', 'bivouac', 'atelier'],
  solo: ['essenza', 'explora', 'explora-plus', 'bivouac', 'atelier'],
};

/** Base level content by level id and locale (shared across types unless overridden). */
const BASE_CONTENT: Record<
  ExperienceLevelId,
  Record<Locale, Omit<ExperienceLevelContent, 'id'>>
> = {
  essenza: {
    es: {
      name: 'Essenza',
      subtitle: 'La escapada express',
      maxNights: 2,
      features: [
        { title: 'Duración', description: '2 noches (Escapada Fugaz)' },
        { title: 'Destinos', description: 'Destinos Nacionales' },
        {
          title: 'Transporte',
          description: 'Tierra / Low Cost (Llegada práctica)',
        },
        {
          title: 'Alojamiento',
          description: 'Confort (3★) - Funcional y con onda',
        },
        { title: 'Beneficios', description: 'Guía General del Destino' },
      ],
      closingLine:
        'Un escape breve, suficiente para mirarse distinto y recordar por qué empezó todo.',
      ctaLabel: 'Den el primer paso',
    },
    en: {
      name: 'Essenza',
      subtitle: 'The express escape',
      maxNights: 2,
      features: [
        { title: 'Duration', description: '2 nights (Quick escape)' },
        { title: 'Destinations', description: 'National destinations' },
        {
          title: 'Transport',
          description: 'Land / Low cost (Practical arrival)',
        },
        {
          title: 'Accommodation',
          description: 'Comfort (3★) - Functional and stylish',
        },
        { title: 'Benefits', description: 'General destination guide' },
      ],
      closingLine:
        'A short escape, enough to see each other differently and remember how it started.',
      ctaLabel: 'Take the first step',
    },
  },
  explora: {
    es: {
      name: 'Modo Explora',
      subtitle: 'Viaje activo y Flexible',
      maxNights: 3,
      features: [
        {
          title: 'Duración',
          description: '3 Noches (+Mayor flexibilidad)',
        },
        {
          title: 'Destinos',
          description: 'Nacionales+ (Más lejos & Regionales)',
        },
        {
          title: 'Transporte',
          description: 'Vuelos Básicos (Mochila en mano)',
        },
        {
          title: 'Alojamiento',
          description: '+ Estilo (3-4★) - Eleva tu estancia',
        },
        {
          title: 'Beneficios',
          description:
            'Guía Randomtrip del destino, diseñada para descubrir juntos',
        },
      ],
      closingLine:
        'Para los que creen que la mejor forma de enamorarse es perderse y reencontrarse.',
      ctaLabel: 'Exploren su historia',
    },
    en: {
      name: 'Modo Explora',
      subtitle: 'Active and flexible trip',
      maxNights: 3,
      features: [
        { title: 'Duration', description: '3 nights (+More flexibility)' },
        {
          title: 'Destinations',
          description: 'National+ (Further & regional)',
        },
        {
          title: 'Transport',
          description: 'Basic flights (Carry-on only)',
        },
        {
          title: 'Accommodation',
          description: '+ Style (3-4★) - Elevate your stay',
        },
        {
          title: 'Benefits',
          description:
            'Randomtrip destination guide, designed to discover together',
        },
      ],
      closingLine:
        'For those who believe the best way to fall in love is to get lost and find each other again.',
      ctaLabel: 'Explore your story',
    },
  },
  'explora-plus': {
    es: {
      name: 'Explora+',
      subtitle: 'Más capas, más momentos',
      maxNights: 4,
      features: [
        {
          title: 'Duración',
          description: '4 Noches (+Puentes & Feriados)',
        },
        {
          title: 'Destinos',
          description: '+ Continentales (Nuevas fronteras)',
        },
        {
          title: 'Transporte',
          description: 'Vuelos Clásicos (Equipaje estándar)',
        },
        {
          title: 'Alojamiento',
          description: '+ Premium (4★) - Upscale & Boutique',
        },
        {
          title: 'Beneficios',
          description:
            '1 Experiencia Incluida + Guía Destination Decoded (guía personalizada para que cada día sea una sorpresa curada)',
        },
      ],
      closingLine:
        'Más noches, más sorpresas, más excusas para coleccionar recuerdos de a dos.',
      ctaLabel: 'Suban la apuesta',
    },
    en: {
      name: 'Explora+',
      subtitle: 'More layers, more moments',
      maxNights: 4,
      features: [
        {
          title: 'Duration',
          description: '4 nights (+Long weekends & holidays)',
        },
        {
          title: 'Destinations',
          description: '+ Continental (New frontiers)',
        },
        {
          title: 'Transport',
          description: 'Classic flights (Standard baggage)',
        },
        {
          title: 'Accommodation',
          description: '+ Premium (4★) - Upscale & boutique',
        },
        {
          title: 'Benefits',
          description:
            '1 experience included + Destination Decoded guide (personalized so each day is a curated surprise)',
        },
      ],
      closingLine:
        'More nights, more surprises, more excuses to collect memories together.',
      ctaLabel: 'Raise the stakes',
    },
  },
  bivouac: {
    es: {
      name: 'Bivouac',
      subtitle: 'Desconexión Total',
      maxNights: 5,
      features: [
        {
          title: 'Duración',
          description: '5 Noches (Sin restricciones)',
        },
        {
          title: 'Destinos',
          description: '+ Intercontinental (Destinos soñados)',
        },
        {
          title: 'Transporte',
          description: 'Vuelos Full (Máxima comodidad)',
        },
        {
          title: 'Alojamiento',
          description: '+ Upper-Scale (4-5★) - Diseño y Servicio',
        },
        {
          title: 'Beneficios',
          description:
            '1 Experiencia Exclusiva + Perks. (ej: late check-out, upgrade, amenities, etc.) + Guía Destination Decoded (guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen)',
        },
      ],
      closingLine:
        'Un viaje que se cuida como se cuida una relación: con detalle y paciencia.',
      ctaLabel: 'Viajen distinto',
    },
    en: {
      name: 'Bivouac',
      subtitle: 'Total disconnection',
      maxNights: 5,
      features: [
        {
          title: 'Duration',
          description: '5 nights (No restrictions)',
        },
        {
          title: 'Destinations',
          description: '+ Intercontinental (Dream destinations)',
        },
        {
          title: 'Transport',
          description: 'Full flights (Maximum comfort)',
        },
        {
          title: 'Accommodation',
          description: '+ Upper-scale (4-5★) - Design and service',
        },
        {
          title: 'Benefits',
          description:
            '1 exclusive experience + perks (e.g. late check-out, upgrade, amenities) + Destination Decoded guide (curated by our Tripper Travel Advisors, with keys few know)',
        },
      ],
      closingLine:
        'A trip cared for like a relationship: with detail and patience.',
      ctaLabel: 'Travel different',
    },
  },
  atelier: {
    es: {
      name: 'Atelier Getaway',
      subtitle: 'Amor a medida',
      maxNights: 7,
      features: [
        {
          title: 'Duración',
          description: '100% Flexible (Sin límite de días)',
        },
        {
          title: 'Destinos',
          description: 'Global (El mundo a tu alcance)',
        },
        {
          title: 'Transporte',
          description: 'Flex / Premium / Privado (A tu medida)',
        },
        {
          title: 'Alojamiento',
          description: 'High-End & Hoteles de Autor (Selección Curada)',
        },
        {
          title: 'Beneficios',
          description:
            'Co-creación del viaje con un Tripper Travel Advisor + equipo de soporte 24/7.',
        },
      ],
      closingLine:
        'Un lienzo en blanco para crear la escapada que nadie más podrá repetir.',
      ctaLabel: 'Creen lo irrepetible',
    },
    en: {
      name: 'Atelier Getaway',
      subtitle: 'Love made to measure',
      maxNights: 7,
      features: [
        {
          title: 'Duration',
          description: '100% flexible (No day limit)',
        },
        {
          title: 'Destinations',
          description: 'Global (The world at your reach)',
        },
        {
          title: 'Transport',
          description: 'Flex / Premium / Private (To your measure)',
        },
        {
          title: 'Accommodation',
          description: 'High-end & author hotels (Curated selection)',
        },
        {
          title: 'Benefits',
          description:
            'Trip co-creation with a Tripper Travel Advisor + 24/7 support team.',
        },
      ],
      closingLine:
        'A blank canvas to create the escape no one else will be able to repeat.',
      ctaLabel: 'Create the unique',
    },
  },
};

/** Per-type, per-level overrides (from docs originalData). Keys match feature titles in base (es/en). */
interface TypeLevelOverride {
  ctaLabel?: string;
  closingLine?: string;
  /** Override feature description by feature title (e.g. "Beneficios", "Alojamiento"). */
  featureOverrides?: Record<string, string>;
  name?: string;
  subtitle?: string;
}

/** Type-specific copy and feature overrides by level and locale. BOND/couple is the base. */
const TYPE_LEVEL_OVERRIDES: Record<
  TravelerTypeSlug,
  Partial<Record<ExperienceLevelId, Record<Locale, TypeLevelOverride>>>
> = {
  couple: {
    atelier: {
      es: { subtitle: 'Tu Tripper Advisor personal (Couple Edition)' },
      en: { subtitle: 'Your personal Tripper Advisor (Couple Edition)' },
    },
  },
  solo: {
    essenza: {
      es: {
        closingLine:
          'Un escape breve para perderte en lo simple y encontrarte en lo inesperado.',
        ctaLabel: 'Arranca tu Essenza',
        featureOverrides: {
          Beneficios: 'Guía esencial para moverte sin complicaciones',
        },
      },
      en: {
        closingLine:
          'A short escape to lose yourself in the simple and find yourself in the unexpected.',
        ctaLabel: 'Start your Essenza',
        featureOverrides: {
          Benefits: 'Essential guide to get around without hassle',
        },
      },
    },
    explora: {
      es: {
        closingLine:
          'Diseñado para quienes viajan livianos y quieren descubrir sin guion.',
        ctaLabel: 'Activa tu Modo Explora',
        featureOverrides: {
          Beneficios:
            'Guía Randomtrip diseñada para descubrir a tu ritmo',
        },
      },
      en: {
        closingLine:
          'Designed for those who travel light and want to discover without a script.',
        ctaLabel: 'Activate your Modo Explora',
        featureOverrides: {
          Benefits:
            'Randomtrip guide designed to discover at your own pace',
        },
      },
    },
    'explora-plus': {
      es: {
        closingLine:
          'Más noches, más encuentros inesperados y más razones para volver distinto.',
        ctaLabel: 'Sube de nivel',
      },
      en: {
        closingLine:
          'More nights, more unexpected encounters and more reasons to come back different.',
        ctaLabel: 'Level up',
      },
    },
    bivouac: {
      es: {
        closingLine:
          'Un viaje íntimo, cuidado al detalle, que convierte la soledad en un lujo personal.',
        ctaLabel: 'Viaja distinto',
      },
      en: {
        closingLine:
          'An intimate trip, cared for in detail, that turns solitude into a personal luxury.',
        ctaLabel: 'Travel different',
      },
    },
    atelier: {
      es: { subtitle: 'Tu Tripper Advisor personal (Sol@ Edition)' },
      en: { subtitle: 'Your personal Tripper Advisor (Solo Edition)' },
    },
  },
  family: {
    essenza: {
      es: {
        closingLine:
          'Una escapada familiar con lo esencial, sin estrés, para que todos disfruten.',
      },
      en: {
        closingLine:
          'A family escape with the essentials, stress-free, so everyone can enjoy.',
      },
    },
    explora: {
      es: {
        closingLine:
          'Para familias que quieren explorar a su ritmo, con la flexibilidad que necesitan.',
      },
      en: {
        closingLine:
          'For families who want to explore at their own pace, with the flexibility they need.',
      },
    },
    'explora-plus': {
      es: {
        closingLine:
          'Más días, más actividades, más recuerdos imborrables para toda la familia.',
      },
      en: {
        closingLine:
          'More days, more activities, more unforgettable memories for the whole family.',
      },
    },
    bivouac: {
      es: {
        closingLine:
          'Una experiencia familiar única, con detalles que marcan la diferencia.',
      },
      en: {
        closingLine:
          'A unique family experience, with details that make the difference.',
      },
    },
    atelier: {
      es: {
        subtitle: 'Tu Tripper Advisor personal (Family Edition)',
        closingLine:
          'Una experiencia a medida donde la familia entera viaja como protagonista.',
      },
      en: {
        subtitle: 'Your personal Tripper Advisor (Family Edition)',
        closingLine:
          'A tailor-made experience where the whole family travels as the protagonist.',
      },
    },
  },
  group: {
    atelier: {
      es: { subtitle: 'Tu Tripper Advisor personal (Group Edition)' },
      en: { subtitle: 'Your personal Tripper Advisor (Group Edition)' },
    },
  },
  paws: {
    essenza: {
      es: {
        featureOverrides: {
          Alojamiento: 'Confort (3★) pet-friendly',
          Beneficios: 'Guía esencial con mapa pet-friendly',
        },
      },
      en: {
        featureOverrides: {
          Accommodation: 'Comfort (3★) pet-friendly',
          Benefits: 'Essential guide with pet-friendly map',
        },
      },
    },
    explora: {
      es: {
        featureOverrides: {
          Alojamiento: 'Estilo (3–4★) pet-friendly',
          Beneficios:
            'Guía general con tips, rutas y spots pet-friendly',
        },
      },
      en: {
        featureOverrides: {
          Accommodation: 'Style (3–4★) pet-friendly',
          Benefits: 'General guide with tips, routes and pet-friendly spots',
        },
      },
    },
    'explora-plus': {
      es: {
        featureOverrides: {
          Alojamiento: 'Premium (4★) boutique pet-friendly',
        },
      },
      en: {
        featureOverrides: {
          Accommodation: 'Premium (4★) boutique pet-friendly',
        },
      },
    },
    bivouac: {
      es: {
        featureOverrides: {
          Alojamiento: 'Upper-Scale (4–5★) pet-friendly',
        },
      },
      en: {
        featureOverrides: {
          Accommodation: 'Upper-scale (4–5★) pet-friendly',
        },
      },
    },
    atelier: {
      es: { subtitle: 'Tu Tripper Advisor personal' },
      en: { subtitle: 'Your personal Tripper Advisor' },
    },
  },
  honeymoon: {},
};

/** NUPTIA: only atelier with "Honeymoon Edition" copy. */
const HONEYMOON_ATELIER_CONTENT: Record<
  Locale,
  Pick<ExperienceLevelContent, 'name' | 'subtitle' | 'closingLine' | 'ctaLabel'>
> = {
  es: {
    name: 'Honeymoon Edition',
    subtitle: 'Atelier Getaway',
    closingLine:
      'El comienzo perfecto: co-creación con un Tripper Travel Advisor para una luna de miel irrepetible.',
    ctaLabel: 'Vivan su Honeymoon Edition',
  },
  en: {
    name: 'Honeymoon Edition',
    subtitle: 'Atelier Getaway',
    closingLine:
      'The perfect beginning: co-creation with a Tripper Travel Advisor for an unforgettable honeymoon.',
    ctaLabel: 'Live your Honeymoon Edition',
  },
};

function getLocale(locale?: string): Locale {
  return locale && hasLocale(locale) ? (locale as Locale) : DEFAULT_LOCALE;
}

function applyFeatureOverrides(
  features: LevelFeature[],
  overrides: Record<string, string> | undefined,
): LevelFeature[] {
  if (!overrides || Object.keys(overrides).length === 0)
    return features;
  return features.map((f) => {
    const desc = overrides[f.title];
    return desc !== undefined ? { ...f, description: desc } : f;
  });
}

/**
 * Planner section header (title, subtitle, eyebrow) for TypePlanner. Single source of truth.
 */
export function getPlannerHeader(
  type: TravelerTypeSlug | string,
  locale?: string,
): PlannerHeader {
  const loc = getLocale(locale);
  const slug = type as TravelerTypeSlug;
  if (!(slug in PLANNER_HEADERS))
    throw new Error(`Unknown traveler type: ${type}`);
  return PLANNER_HEADERS[slug][loc];
}

/**
 * Level ids available for the given traveler type.
 * Honeymoon (NUPTIA) only returns atelier.
 */
export function getLevelIdsForType(
  type: TravelerTypeSlug | string,
): readonly ExperienceLevelId[] {
  const slug = type as TravelerTypeSlug;
  if (!LEVEL_IDS_BY_TYPE[slug]) return LEVEL_IDS_BY_TYPE.couple;
  return LEVEL_IDS_BY_TYPE[slug];
}

/**
 * Unified level content for (levelId, type, locale).
 * Price is not included – use getBasePricePerPerson(type, levelId) from traveler-types.
 * Content is type-specific per docs (BOND/SOLUM/KIN/CREW/PAWS/NUPTIA).
 */
export function getLevelContent(
  levelId: ExperienceLevelId | string,
  type: TravelerTypeSlug | string,
  locale?: string,
): ExperienceLevelContent | null {
  const normalized = normalizeExperienceLevelId(levelId);
  if (!normalized) return null;
  const loc = getLocale(locale);
  const base = BASE_CONTENT[normalized]?.[loc];
  if (!base) return null;

  const typeSlug = type as TravelerTypeSlug;
  const isHoneymoonAtelier =
    type === 'honeymoon' && normalized === 'atelier';
  const typeOverride = TYPE_LEVEL_OVERRIDES[typeSlug]?.[normalized]?.[loc];
  const honeymoonOverride = isHoneymoonAtelier
    ? HONEYMOON_ATELIER_CONTENT[loc]
    : null;

  const name = honeymoonOverride?.name ?? typeOverride?.name ?? base.name;
  const subtitle =
    honeymoonOverride?.subtitle ?? typeOverride?.subtitle ?? base.subtitle;
  const closingLine =
    honeymoonOverride?.closingLine ??
    typeOverride?.closingLine ??
    base.closingLine;
  const ctaLabel =
    honeymoonOverride?.ctaLabel ?? typeOverride?.ctaLabel ?? base.ctaLabel;
  const features = applyFeatureOverrides(
    base.features,
    typeOverride?.featureOverrides,
  );

  return {
    id: normalized,
    name,
    subtitle,
    maxNights: base.maxNights,
    features,
    closingLine,
    ctaLabel,
  };
}
