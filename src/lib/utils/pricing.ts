/**
 * Pricing helpers – single source: lib/data/traveler-types (PRICE_BY_TYPE_AND_LEVEL).
 */

export {
  getBasePricePerPerson,
  getPricePerPerson,
  type TravelerTypeSlug,
  type PriceLevelId,
} from '@/lib/data/traveler-types';
export { getPricingCatalog } from '@/lib/helpers/pricing';
