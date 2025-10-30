import { 
  allExcuses, 
  getExcusesByTravelerType, 
  getExcuseByKey as getCentralizedExcuseByKey,
  type ExcuseData 
} from '@/lib/data/shared/excuses';

// Re-export the centralized types and data
export type { ExcuseData } from '@/lib/data/shared/excuses';

// All available excuse keys from centralized data
export const EXCUSE_KEYS = allExcuses.map(excuse => excuse.key);
export type ExcuseKey = typeof EXCUSE_KEYS[number];

// Excuse option keys from centralized data
export const EXCUSE_OPTION_KEYS = allExcuses.flatMap(excuse => 
  excuse.details.options.map(option => option.key)
);
export type ExcuseOptionKey = typeof EXCUSE_OPTION_KEYS[number];

/**
 * Get excuse data by key
 */
export function getExcuseByKey(key: string): ExcuseData | null {
  return getCentralizedExcuseByKey(key);
}

/**
 * Get excuse title by key
 */
export function getExcuseTitle(key: string): string {
  const excuse = getExcuseByKey(key);
  return excuse?.title || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get excuse description by key
 */
export function getExcuseDescription(key: string): string {
  const excuse = getExcuseByKey(key);
  return excuse?.description || '';
}

/**
 * Get excuse image by key
 */
export function getExcuseImage(key: string): string {
  const excuse = getExcuseByKey(key);
  return excuse?.img || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e';
}

/**
 * Get all available excuse keys
 */
export function getAllExcuseKeys(): string[] {
  return allExcuses.map(excuse => excuse.key);
}

/**
 * Check if an excuse key exists
 */
export function isValidExcuseKey(key: string): boolean {
  return allExcuses.some(excuse => excuse.key === key);
}

/**
 * Get excuse options by excuse key
 */
export function getExcuseOptions(excuseKey: string): Array<{
  key: string;
  label: string;
  desc: string;
  img: string;
}> {
  const excuse = getExcuseByKey(excuseKey);
  return excuse?.details?.options || [];
}

/**
 * Get excuse option by key
 */
export function getExcuseOption(excuseKey: string, optionKey: string): {
  key: string;
  label: string;
  desc: string;
  img: string;
} | null {
  const options = getExcuseOptions(excuseKey);
  return options.find(option => option.key === optionKey) || null;
}

/**
 * Get excuses by traveler type
 */
export function getExcusesByType(travelerType: string): ExcuseData[] {
  return getExcusesByTravelerType(travelerType);
}
