// frontend/src/store/journeyStore.ts
import { create } from 'zustand'

export type LevelSlug = 'essenza'|'modo-explora'|'explora-plus'|'bivouac'|'atelier-getaway'

export type Logistics = {
  country?: { name: string; code?: string }
  city?: { name: string; placeId?: string }
  startDate?: string // ISO
  endDate?: string   // ISO
  nights: number     // default 1
  pax: number        // default 2
}

export type Filters = {
  transport: 'avion'|'bus'|'tren'|'barco'
  climate: 'indistinto'|'calido'|'frio'|'templado'
  maxTravelTime: 'sin-limite'|'3h'|'5h'|'8h'
  departPref: 'indistinto'|'manana'|'tarde'|'noche'
  arrivePref: 'indistinto'|'manana'|'tarde'|'noche'
  avoidDestinations: string[] // máx 15 (cada uno cuenta 1 filtro)
}

export type AddonUnit = 'per_pax'|'per_trip'|'percent_total'
export type AddonSelection = { id: string; qty: number; optionId?: string }
export type AddonsState = {
  selected: AddonSelection[] // sólo los elegidos
}

type JourneyState = {
  from: 'tripper'|''
  type: 'couple'|'family'|'group'|'solo'|'honeymoon'|'paws'
  level: LevelSlug
  displayPrice: string
  basePriceUsd: number
  logistics: Logistics
  filters: Filters
  addons: AddonsState
  filtersCostUsd: number      // por viaje (total)
  addonsCostUsd: number       // por viaje (total)
  totalPerPaxUsd: number
  activeTab: 'logistics'|'preferences'|'avoid'
  setPartial: (patch: Partial<JourneyState>) => void
  setAddon: (sel: AddonSelection|undefined) => void
  removeAddon: (id: string) => void
  resetAddons: () => void
}

export function countOptionalFilters(f: Filters): number {
  let n = 0
  if (f.climate !== 'indistinto') n++
  if (f.maxTravelTime !== 'sin-limite') n++
  if (f.departPref !== 'indistinto') n++
  if (f.arrivePref !== 'indistinto') n++
  n += (f.avoidDestinations?.length ?? 0) // cada destino suma 1
  return n
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  from: '',
  type: 'couple',
  level: 'modo-explora',
  displayPrice: '',
  basePriceUsd: 0,
  logistics: { nights: 1, pax: 2 },
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
    const cur = get().addons.selected
    let next = [...cur]
    if (!sel) return
    const i = next.findIndex(a => a.id === sel.id)
    if (sel.qty <= 0) {
      if (i >= 0) next.splice(i,1)
    } else {
      if (i >= 0) next[i] = sel
      else next.push(sel)
    }
    set({ addons: { selected: next }})
  },
  removeAddon: (id) => {
    const next = get().addons.selected.filter(a => a.id !== id)
    set({ addons: { selected: next }})
  },
  resetAddons: () => set({ addons: { selected: [] }}),
}))
