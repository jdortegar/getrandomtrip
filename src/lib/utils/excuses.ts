/**
 * Excuse helpers – excuse step rule from product-config (aligned with traveler-types);
 * excuse content (titles, options) from lib/data/shared/excuses.
 */

export { hasExcuseStep } from '@/lib/constants/product-config';
export {
  getExcuseByKey,
  getExcuseDescription,
  getExcuseOptions,
  getExcuseTitle,
  getExcusesByType,
  getHasExcuseStep,
  type ExcuseData,
} from '@/lib/helpers/excuse-helper';
