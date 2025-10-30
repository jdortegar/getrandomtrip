// frontend/src/store/journeyStore.ts
import { create, StateCreator } from 'zustand';

export type LevelSlug =
  | 'essenza'
  | 'modo-explora'
  | 'explora-plus'
  | 'bivouac'
  | 'atelier-getaway';

export type Logistics = {
  country: string;
  city: string;
  startDate?: Date; // ISO
  endDate?: Date; // ISO
  nights: number; // default 1
  pax: number; // default 2
};

export type FilterOption = {
  key: string;
  label: string;
};

export type Filters = {
  transport: FilterOption['key'];
  climate: FilterOption['key'];
  maxTravelTime: FilterOption['key'];
  departPref: FilterOption['key'];
  arrivePref: FilterOption['key'];
  avoidDestinations: string[]; // máx 15 (cada uno cuenta 1 filtro)
};

// Available filter options
export const FILTER_OPTIONS = {
  transport: {
    label: 'Transporte',
    options: [
      { key: 'avion', label: 'Avión' },
      { key: 'bus', label: 'Bus' },
      { key: 'tren', label: 'Tren' },
      { key: 'barco', label: 'Barco/Crucero' },
    ],
  },
  climate: {
    label: 'Clima',
    options: [
      { key: 'indistinto', label: 'Indistinto' },
      { key: 'calido', label: 'Cálido' },
      { key: 'frio', label: 'Frío' },
      { key: 'templado', label: 'Templado' },
    ],
  },
  maxTravelTime: {
    label: 'Tiempo máximo de viaje',
    options: [
      { key: 'sin-limite', label: 'Sin límite' },
      { key: '3h', label: 'Hasta 3h' },
      { key: '5h', label: 'Hasta 5h' },
      { key: '8h', label: 'Hasta 8h' },
    ],
  },
  departPref: {
    label: 'Salida',
    options: [
      { key: 'indistinto', label: 'Indistinto' },
      { key: 'manana', label: 'Mañana' },
      { key: 'tarde', label: 'Tarde' },
      { key: 'noche', label: 'Noche' },
    ],
  },
  arrivePref: {
    label: 'Llegada',
    options: [
      { key: 'indistinto', label: 'Indistinto' },
      { key: 'manana', label: 'Mañana' },
      { key: 'tarde', label: 'Tarde' },
      { key: 'noche', label: 'Noche' },
    ],
  },
  avoidDestinations: {
    label: 'Destinos a evitar',
    options: [],
  },
};

export type AddonUnit = 'per_pax' | 'per_trip' | 'percent_total';
export type AddonSelection = { id: string; qty: number };
export type AddonsState = {
  selected: AddonSelection[]; // sólo los elegidos
};

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
    transport: 'avion',
    climate: 'indistinto',
    maxTravelTime: 'sin-limite',
    departPref: 'indistinto',
    arrivePref: 'indistinto',
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
        transport: 'avion',
        climate: 'indistinto',
        maxTravelTime: 'sin-limite',
        departPref: 'indistinto',
        arrivePref: 'indistinto',
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
        transport: 'avion',
        climate: 'indistinto',
        maxTravelTime: 'sin-limite',
        departPref: 'indistinto',
        arrivePref: 'indistinto',
        avoidDestinations: [],
      },
      addons: { selected: [] },
      filtersCostUsd: 0,
      addonsCostUsd: 0,
      totalPerPaxUsd: 0,
      activeTab: 'logistics',
    }),
});
