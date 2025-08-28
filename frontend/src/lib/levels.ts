import type { LevelSlug } from '@/store/journeyStore';

export const MAX_NIGHTS: Record<LevelSlug, number | 'custom'> = {
  'essenza': 2,
  'modo-explora': 3,
  'explora-plus': 4,
  'bivouac': 5,
  'atelier-getaway': 'custom',
};

export const getMaxNights = (level: LevelSlug) => MAX_NIGHTS[level];

export function parseBasePrice(displayPrice: string): number {
  const m = displayPrice?.match(/(\d{2,5})/);
  return m ? parseInt(m[1], 10) : 0;
}