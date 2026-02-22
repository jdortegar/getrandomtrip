// Blog filter options for TravelType and Excuse. Trippers come from DB via /api/trippers.
// Aligns with journey/tripper domain: Package has type + excuseKey; User is tripper.

import { TYPE_LABELS } from '@/lib/constants/traveller-types';
import { allExcuses, type ExcuseData } from '@/lib/data/shared/excuses';

// -----------------------------------------------------------------------------
// Travel type (Tipo de viaje) – keys from traveller-types
// -----------------------------------------------------------------------------

export interface TravelTypeOption {
  key: string;
  label: string;
}

export const BLOG_TRAVEL_TYPE_OPTIONS: TravelTypeOption[] = Object.entries(
  TYPE_LABELS,
).map(([key, label]) => ({ key, label }));

// -----------------------------------------------------------------------------
// Excuse – key + label for filter pill/dropdown (from shared excuses)
// -----------------------------------------------------------------------------

export interface ExcuseFilterOption {
  key: string;
  label: string;
}

function excuseToFilterOption(e: ExcuseData): ExcuseFilterOption {
  return { key: e.key, label: e.title };
}

export const BLOG_EXCUSE_OPTIONS: ExcuseFilterOption[] =
  allExcuses.map(excuseToFilterOption);

// -----------------------------------------------------------------------------
// Tripper – shape for "By Tripper" filter (id, name, slug, avatarUrl).
// Data is loaded from GET /api/trippers (getAllTrippers); map tripperSlug → slug.
// -----------------------------------------------------------------------------

export interface TripperFilterOption {
  avatarUrl: string | null;
  id: string;
  name: string;
  slug: string;
}
