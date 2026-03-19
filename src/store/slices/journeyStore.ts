// frontend/src/store/journeyStore.ts
import { create, StateCreator } from 'zustand';
import {
  FILTER_OPTION_KEYS,
  FILTER_OPTIONS,
  type FilterOption,
} from '@/lib/constants/journey-filters';
import type {
  AddonSelection,
  AddonsState,
  AddonUnit,
  LevelSlug,
} from '@/types/core';

export type { LevelSlug };

export type Logistics = {
  city: string;
  country: string;
  endDate?: Date;
  nights: number;
  pax: number;
  startDate?: Date;
};

export type { FilterOption };

export type Filters = {
  accommodationType: FilterOption['key'];
  arrivePref: FilterOption['key'];
  climate: FilterOption['key'];
  departPref: FilterOption['key'];
  maxTravelTime: FilterOption['key'];
  transport: FilterOption['key'];
  avoidDestinations: string[];
};

export { FILTER_OPTION_KEYS, FILTER_OPTIONS };

export type { AddonUnit, AddonSelection, AddonsState };

export type JourneyState = {
  from: string;
  type: string;
  level: string;
  displayPrice: string;
  basePriceUsd: number;
  tripperId?: string;
  logistics: Logistics;
  filters: Filters;
  addons: AddonsState;
  filtersCostUsd: number; // por viaje (total)
  addonsCostUsd: number; // por viaje (total)
  totalPerPaxUsd: number;
  activeTab: 'logistics' | 'preferences' | 'addons';
  // Hidden state for tripper package context (not exposed to user)
  _tripperPackageDestinations?: Array<{ city: string; country: string }>;
  _originLocked?: boolean; // When origin came from URL params (tripper flow)
  setPartial: (patch: Partial<JourneyState>) => void;
  setAddon: (sel: AddonSelection | undefined) => void;
  removeAddon: (id: string) => void;
  resetAddons: () => void;
  resetJourney: () => void;
  clearFormAfterPurchase: () => void;
  /** Updates origin and resets preference filters (and their cost). Call when country or city changes. */
  setOriginAndResetFilters: (country: string, city: string) => void;
};

export const createJourneySlice: StateCreator<JourneyState> = (set, get) => ({
  from: '',
  type: 'couple',
  level: 'modo-explora',
  displayPrice: '',
  basePriceUsd: 0,
  tripperId: undefined,
  logistics: {
    nights: 1,
    pax: 1,
    city: '',
    country: '',
    startDate: undefined,
    endDate: undefined,
  },
  filters: {
    accommodationType: 'any',
    arrivePref: 'any',
    climate: 'any',
    departPref: 'any',
    maxTravelTime: 'no-limit',
    transport: 'plane',
    avoidDestinations: [],
  },
  addons: { selected: [] },
  filtersCostUsd: 0,
  addonsCostUsd: 0,
  totalPerPaxUsd: 0,
  activeTab: 'logistics',
  setPartial: (patch) => set({ ...get(), ...patch }),
  setAddon: (sel) => {
    const cur = get().addons.selected;
    let next = [...cur];
    if (!sel) return;
    const i = next.findIndex((a) => a.id === sel.id);
    if (sel.qty <= 0) {
      if (i >= 0) next.splice(i, 1);
    } else {
      if (i >= 0) next[i] = sel;
      else next.push(sel);
    }
    set({ addons: { selected: next } });
  },
  removeAddon: (id) => {
    const next = get().addons.selected.filter((a) => a.id !== id);
    set({ addons: { selected: next } });
  },
  resetAddons: () => set({ addons: { selected: [] } }),
  resetJourney: () =>
    set({
      basePriceUsd: 0,
      displayPrice: '',
      level: 'essenza',
      type: 'solo',
      logistics: {
        nights: 1,
        pax: 1,
        city: '',
        country: '',
        startDate: undefined,
        endDate: undefined,
      },
      filters: {
        accommodationType: 'any',
        arrivePref: 'any',
        climate: 'any',
        departPref: 'any',
        maxTravelTime: 'no-limit',
        transport: 'plane',
        avoidDestinations: [],
      },
      addons: { selected: [] },
      filtersCostUsd: 0,
      addonsCostUsd: 0,
      totalPerPaxUsd: 0,
      activeTab: 'logistics',
    }),
  clearFormAfterPurchase: () =>
    set({
      // Keep basic journey info but clear form-specific data
      logistics: {
        nights: 1,
        pax: 1,
        city: '',
        country: '',
        startDate: undefined,
        endDate: undefined,
      },
      filters: {
        accommodationType: 'any',
        arrivePref: 'any',
        climate: 'any',
        departPref: 'any',
        maxTravelTime: 'no-limit',
        transport: 'plane',
        avoidDestinations: [],
      },
      addons: { selected: [] },
      filtersCostUsd: 0,
      addonsCostUsd: 0,
      totalPerPaxUsd: 0,
      activeTab: 'logistics',
    }),
  setOriginAndResetFilters: (country, city) => {
    const state = get();
    const pax = Math.max(1, state.logistics.pax ?? 1);
    set({
      filters: {
        accommodationType: 'any',
        arrivePref: 'any',
        climate: 'any',
        departPref: 'any',
        maxTravelTime: 'no-limit',
        transport: 'plane',
        avoidDestinations: [],
      },
      filtersCostUsd: 0,
      logistics: { ...state.logistics, city, country },
      totalPerPaxUsd: (state.basePriceUsd + state.addonsCostUsd) / pax,
    });
  },
});
