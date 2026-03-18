/**
 * @deprecated Use level metadata and prices from `@/lib/data/traveler-types` instead.
 * Get level list via getTravelerType(type, locale).planner.levels; price via getBasePricePerPerson(type, levelId).
 * This file is kept for backward compatibility only and may be removed in a future release.
 */
import type { LevelSlug } from '@/store/slices/journeyStore';

/**
 * @deprecated Prefer traveler-types planner.levels; price from getBasePricePerPerson(type, levelId).
 */
export interface Level {
  id: LevelSlug;
  name: string;
  description: string;
  color: string;
  maxNights: number;
  price: number;
  priceLabel: string;
  minBudget: number;
  maxBudget: number;
  features: string[];
  icon: string;
}

/** @deprecated Prefer getTravelerType(type, locale).planner.levels; price from getBasePricePerPerson. */
export const LEVELS: Level[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    description: 'Lo esencial con estilo',
    color: 'bg-emerald-500',
    maxNights: 2,
    price: 450,
    priceLabel: '450 USD',
    minBudget: 200,
    maxBudget: 500,
    features: [
      'Máx 2 noches',
      'Low cost (buses o vuelos off-peak)',
      'Menor disponibilidad, con restricciones',
      'Midscale (3★ o equivalentes)',
      'Guía esencial para moverte sin complicaciones',
    ],
    icon: '🌱',
  },
  {
    id: 'modo-explora',
    name: 'Modo Explora',
    description: 'Activo y flexible',
    color: 'bg-blue-500',
    maxNights: 3,
    price: 650,
    priceLabel: '650 USD',
    minBudget: 500,
    maxBudget: 800,
    features: [
      'Hasta 3 noches',
      'Multimodal, horarios flexibles',
      'Mayor disponibilidad; algunos bloqueos en feriados',
      'Midscale – Upper Midscale',
      'Guía Randomtrip diseñada para descubrir a tu ritmo',
    ],
    icon: '🚀',
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    description: 'Sube de nivel tu experiencia',
    color: 'bg-purple-500',
    maxNights: 4,
    price: 950,
    priceLabel: '950 USD',
    minBudget: 800,
    maxBudget: 1200,
    features: [
      'Hasta 4 noches',
      'Multimodal con horarios preferenciales',
      'Alta disponibilidad con flexibilidad',
      'Upper Midscale – Upscale',
      'Guía Randomtrip + 1 experiencia premium',
    ],
    icon: '⭐',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    description: 'Curaduría artesanal',
    color: 'bg-amber-500',
    maxNights: 5,
    price: 1550,
    priceLabel: '1550 USD',
    minBudget: 1300,
    maxBudget: 1700,
    features: [
      'Hasta 5 noches',
      'Multimodal',
      'Sin bloqueos',
      'Upper Upscale (boutique, diseño, stays con alma)',
      'Concierge Advisor + 1 experiencia premium + perks exclusivos',
    ],
    icon: '🏕️',
  },
  {
    id: 'atelier-getaway',
    name: 'Atelier Getaway',
    description: 'Distinción, sin esfuerzo',
    color: 'bg-rose-500',
    maxNights: 14,
    price: 1550,
    priceLabel: 'Desde 1550 USD',
    minBudget: 1700,
    maxBudget: 2000,
    features: [
      'Customizable',
      'Multimodal / a medida',
      'Sin bloqueos',
      'Luxury / de autor / Cadenas Hoteleras A1',
      'Co-creación con Luxury Travel Advisor + equipo 24/7',
    ],
    icon: '🎨',
  },
];

/** @deprecated Use level metadata from traveler-types planner.levels or lib/levels.ts MAX_NIGHTS. */
export const getMaxNights = (level: string) => {
  const levelData = LEVELS.find((l) => l.id === level);
  return levelData?.maxNights || 2;
};

/** @deprecated Use level name from getTravelerType(type, locale).planner.levels. */
export const getLevelName = (level: LevelSlug) => {
  const levelData = LEVELS.find((l) => l.id === level);
  return levelData?.name || 'Unknown';
};

/** @deprecated Use level metadata from traveler-types planner.levels. */
export const getLevelDescription = (level: LevelSlug) => {
  const levelData = LEVELS.find((l) => l.id === level);
  return levelData?.description || '';
};

/** @deprecated Use level metadata from traveler-types or a shared level config. */
export const getLevelColor = (level: LevelSlug) => {
  const levelData = LEVELS.find((l) => l.id === level);
  return levelData?.color || 'bg-gray-500';
};

/** @deprecated Use getTravelerType(type, locale).planner.levels and find by id. */
export const getLevelById = (id: LevelSlug): Level | undefined => {
  return LEVELS.find((level) => level.id === id);
};

/** @deprecated Filter planner.levels by budget or use a dedicated helper from traveler-types. */
export const getLevelsByBudget = (budget: number): Level[] => {
  return LEVELS.filter(
    (level) => budget >= level.minBudget && budget <= level.maxBudget,
  );
};
