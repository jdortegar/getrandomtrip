/**
 * Level helpers – single source: lib/data/traveler-types (planner.levels + PRICE_BY_TYPE_AND_LEVEL).
 * Level metadata and canonical price per type/level.
 */

import type { LevelSlug } from '@/types/core';
import { getTravelerType, getBasePricePerPerson } from '@/lib/data/traveler-types';

/** Map planner level id to URL/store LevelSlug. */
function toLevelSlug(plannerId: string): LevelSlug {
  const n = plannerId.toLowerCase().replace('exploraplus', 'explora-plus');
  if (n === 'explora') return 'modo-explora';
  if (n === 'explora-plus') return 'explora-plus';
  if (n === 'atelier') return 'atelier-getaway';
  return n as LevelSlug;
}

/** Static max nights by level (docs). */
const MAX_NIGHTS_BY_SLUG: Record<LevelSlug, number> = {
  essenza: 2,
  'modo-explora': 3,
  'explora-plus': 4,
  bivouac: 5,
  'atelier-getaway': 14,
};

/** Static display names (fallback when type not available). */
const NAME_BY_SLUG: Record<LevelSlug, string> = {
  essenza: 'Essenza',
  'modo-explora': 'Modo Explora',
  'explora-plus': 'Explora+',
  bivouac: 'Bivouac',
  'atelier-getaway': 'Atelier Getaway',
};

/** Level shape for forms and display (compatible with previous shared/levels). */
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

const COLOR_BY_SLUG: Record<LevelSlug, string> = {
  essenza: 'bg-emerald-500',
  'modo-explora': 'bg-blue-500',
  'explora-plus': 'bg-purple-500',
  bivouac: 'bg-amber-500',
  'atelier-getaway': 'bg-rose-500',
};

const ICON_BY_SLUG: Record<LevelSlug, string> = {
  essenza: '🌱',
  'modo-explora': '🚀',
  'explora-plus': '⭐',
  bivouac: '🏕️',
  'atelier-getaway': '🎨',
};

/**
 * Levels for a traveler type with canonical price from source of truth.
 */
export function getLevelsForType(
  type: string,
  locale?: string,
): Level[] {
  const data = getTravelerType(type, locale);
  if (!data?.planner?.levels?.length) return [];
  return data.planner.levels.map((lev) => {
    const slug = toLevelSlug(lev.id);
    const price = getBasePricePerPerson(type, lev.id);
    const isLast = slug === 'atelier-getaway';
    const features = lev.features?.map((f) => f.description ?? f.title) ?? [];
    return {
      id: slug,
      name: lev.name,
      description: lev.subtitle ?? lev.name,
      color: COLOR_BY_SLUG[slug] ?? 'bg-gray-500',
      maxNights: MAX_NIGHTS_BY_SLUG[slug] ?? lev.maxNights ?? 2,
      price,
      priceLabel: isLast ? `Desde ${price} USD` : `${price} USD`,
      minBudget: 0,
      maxBudget: 9999,
      features,
      icon: ICON_BY_SLUG[slug] ?? '✨',
    };
  });
}

/**
 * One level by type and level id (levelId can be LevelSlug or planner id).
 */
export function getLevelById(
  type: string | undefined,
  levelId: string,
  locale?: string,
): Level | undefined {
  const t = type ?? 'solo';
  const levels = getLevelsForType(t, locale);
  const normalized = levelId.toLowerCase().replace(/\s+/g, '-');
  const slug =
    normalized === 'modo-explora' || normalized === 'explora'
      ? 'modo-explora'
      : normalized === 'exploraplus' || normalized === 'explora-plus'
        ? 'explora-plus'
        : normalized === 'atelier-getaway' || normalized === 'atelier'
          ? 'atelier-getaway'
          : (normalized as LevelSlug);
  return levels.find((l) => l.id === slug);
}

/**
 * Max nights for a level id (LevelSlug or planner id).
 */
export function getMaxNights(levelId: string): number {
  const slug = normalizeLevelIdToSlug(levelId);
  return MAX_NIGHTS_BY_SLUG[slug] ?? 2;
}

/**
 * Display name for a level id.
 */
export function getLevelName(levelId: string): string {
  const slug = normalizeLevelIdToSlug(levelId);
  return NAME_BY_SLUG[slug] ?? levelId;
}

function normalizeLevelIdToSlug(levelId: string): LevelSlug {
  const n = levelId.toLowerCase().replace(/\s+/g, '-').replace('exploraplus', 'explora-plus');
  if (n === 'explora' || n === 'modo-explora') return 'modo-explora';
  if (n === 'explora-plus') return 'explora-plus';
  if (n === 'atelier' || n === 'atelier-getaway') return 'atelier-getaway';
  if (n === 'essenza' || n === 'bivouac') return n as LevelSlug;
  return 'essenza';
}
