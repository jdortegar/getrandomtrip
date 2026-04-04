/**
 * Level helpers – single source: lib/data/experience-levels (content) +
 * lib/data/traveler-types (price). Level metadata and canonical price per type/level.
 */

import type { LevelSlug } from '@/types/core';
import type {
  Level as PlannerLevel,
  TypePlannerContent,
} from '@/types/planner';
import { getBasePricePerPerson } from '@/lib/data/traveler-types';
import {
  getLevelContent,
  getLevelIdsForType,
  getPlannerHeader,
  type ExperienceLevelId,
} from '@/lib/data/experience-levels';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

/** Map experience level id to URL/store LevelSlug. */
function toLevelSlug(levelId: string): LevelSlug {
  const n = levelId.toLowerCase().replace('exploraplus', 'explora-plus');
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
 * Levels for a traveler type from experience-levels (content) + traveler-types (price).
 */
export function getLevelsForType(type: string, locale?: string): Level[] {
  const levelIds = getLevelIdsForType(type);
  const levels: Level[] = [];
  for (const levelId of levelIds) {
    const content = getLevelContent(levelId as ExperienceLevelId, type, locale);
    if (!content) continue;
    const slug = toLevelSlug(content.id);
    const price = getBasePricePerPerson(type, content.id);
    const isLast = slug === 'atelier-getaway';
    const features = content.features.map((f) => f.description ?? f.title);
    levels.push({
      id: slug,
      name: content.name,
      description: content.subtitle ?? content.name,
      color: COLOR_BY_SLUG[slug] ?? 'bg-gray-500',
      maxNights: MAX_NIGHTS_BY_SLUG[slug] ?? content.maxNights ?? 2,
      price,
      priceLabel: isLast ? `Desde ${price} USD` : `${price} USD`,
      minBudget: 0,
      maxBudget: 9999,
      features,
      icon: ICON_BY_SLUG[slug] ?? '✨',
    });
  }
  return levels;
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
 * Levels in planner shape (for TypePlanner / LevelCard). Uses experience-levels + price + excuses.
 */
export function getPlannerLevelsForType(
  type: string,
  locale?: string,
): PlannerLevel[] {
  const levelIds = getLevelIdsForType(type);
  const excuses = getExcusesByType(type);
  const plannerLevels: PlannerLevel[] = [];
  for (const levelId of levelIds) {
    const content = getLevelContent(levelId as ExperienceLevelId, type, locale);
    if (!content) continue;
    const slug = toLevelSlug(content.id);
    const price = getBasePricePerPerson(type, content.id);
    const isLast = slug === 'atelier-getaway';
    plannerLevels.push({
      id: slug,
      name: content.name,
      subtitle: content.subtitle,
      maxNights: content.maxNights,
      price,
      priceLabel: isLast ? 'Desde' : '',
      priceFootnote: 'por persona',
      features: content.features,
      closingLine: content.closingLine,
      ctaLabel: content.ctaLabel,
      excuses: excuses as PlannerLevel['excuses'],
    });
  }
  return plannerLevels;
}

/**
 * Full TypePlanner content from single source of truth (experience-levels + traveler-types).
 * No merge with type data, no fallbacks.
 */
export function getPlannerContentForType(
  type: string,
  locale?: string,
): TypePlannerContent {
  const header = getPlannerHeader(type, locale);
  const levels = getPlannerLevelsForType(type, locale);
  return {
    eyebrow: header.eyebrow,
    levels,
    subtitle: header.subtitle,
    title: header.title,
  };
}

/** Tier-like shape for grids (ExperienceLevelGrid, TripperTiers). */
export interface TierForDisplay {
  bullets: string[];
  cta: string;
  key: string;
  price?: string;
  tagline?: string;
  testid?: string;
  title: string;
}

/**
 * Tiers for display in grid/cards (from experience-levels + price). Use for ExperienceLevelGrid, TripperTiers.
 */
export function getTiersForDisplay(
  type: string,
  locale?: string,
): TierForDisplay[] {
  const levels = getLevelsForType(type, locale);
  const tierIds = getLevelIdsForType(type);
  const result: TierForDisplay[] = [];
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]!;
    const content = getLevelContent(
      tierIds[i] as ExperienceLevelId,
      type,
      locale,
    );
    const bullets = [
      ...level.features,
      ...(content?.closingLine ? [`📝 ${content.closingLine}`] : []),
    ];
    const isLast = level.id === 'atelier-getaway';
    result.push({
      key: level.id,
      title: level.name,
      tagline: level.description,
      price: isLast
        ? `Desde ${level.price} USD · por persona`
        : `${level.price} USD · por persona`,
      bullets,
      cta: content?.ctaLabel ?? `Elige ${level.name} →`,
      testid: level.id ? `cta-tier-${level.id.replace(/-/g, '')}` : undefined,
    });
  }
  return result;
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
