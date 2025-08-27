import { create } from 'zustand';

export type LevelSlug = 'essenza'|'modo-explora'|'explora-plus'|'bivouac'|'atelier-getaway';

export type Logistics = {
  country?: { name: string; code?: string };
  city?: { name: string; placeId?: string };
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  nights: number;       // default 1
  pax: number;          // default 2
};

export type Filters = {
  transport: 'avion'|'bus'|'tren'|'barco';
  climate: 'indistinto'|'calido'|'frio'|'templado';
  maxTravelTime: 'sin-limite'|'3h'|'5h'|'8h';
  departPref: 'indistinto'|'manana'|'tarde'|'noche';
  arrivePref: 'indistinto'|'manana'|'tarde'|'noche';
  avoidDestinations: string[]; // máx 15 (cuenta como 1 filtro total)
};

type JourneyState = {
  from: 'tripper'|'';
  type: 'couple'|'family'|'group'|'solo'|'honeymoon'|'paws';
  level: LevelSlug;
  displayPrice: string;   // ej. "Hasta 500 USD"
  basePriceUsd: number;   // parseado desde displayPrice
  logistics: Logistics;
  filters: Filters;
  filtersCostUsd: number;
  totalPerPaxUsd: number;
  activeTab: 'logistics'|'filters';
  setPartial: (patch: Partial<JourneyState>) => void;
};

export const useJourneyStore = create<JourneyState>((set, get) => ({
  from: '', type: 'couple', level: 'modo-explora',
  displayPrice: '', basePriceUsd: 0,
  logistics: { nights: 1, pax: 2 },
  filters: {
    transport: 'avion',
    climate: 'indistinto',
    maxTravelTime: 'sin-limite',
    departPref: 'indistinto',
    arrivePref: 'indistinto',
    avoidDestinations: [],
  },
  filtersCostUsd: 0, totalPerPaxUsd: 0,
  activeTab: 'logistics',
  setPartial: (patch) => set({ ...get(), ...patch }),
}));


export function countOptionalFilters(f: Filters): number {
  let n = 0;
  if (f.climate !== 'indistinto') n++;
  if (f.maxTravelTime !== 'sin-limite') n++;
  if (f.departPref !== 'indistinto') n++;
  if (f.arrivePref !== 'indistinto') n++;
  if ((f.avoidDestinations?.length ?? 0) > 0) n++; // cuenta como 1 total
  return n;
}