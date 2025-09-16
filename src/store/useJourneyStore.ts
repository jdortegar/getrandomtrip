'use client';
import { create } from 'zustand';

export type FromGate = 'couple'|'solo'|'family'|'group'|'honeymoon'|'paws'|'tripper';
export type Tier =
  | 'essenza' | 'modo-explora' | 'explora-plus' | 'bivouac' | 'atelier';

type JourneyState = {
  from?: FromGate;
  type?: FromGate;
  tier?: Tier;
  level?: Tier;          // por compatibilidad
  tripperId?: string;
  priceKey?: string;     // p.ej. byTraveller.couple.essenza
  pbp?: number;          // override directo desde la card (precio base por persona)

  currency: string;
  basePricePerPerson: number;

  seedFromParams: (search: URLSearchParams) => void;
  setBasePrice: (price: number) => void;
  setCurrency: (c: string) => void;
};

export const useJourneyStore = create<JourneyState>((set) => ({
  currency: 'USD',
  basePricePerPerson: 0,

  seedFromParams: (p) => {
    const from = (p.get('from') as FromGate | null) || undefined;
    const type = (p.get('type') as FromGate | null) || undefined;
    const tier = (p.get('tier') as Tier | null) || undefined;
    const level = (p.get('level') as Tier | null) || undefined;
    const tripperId = p.get('tripperId') || undefined;
    const priceKey = p.get('priceKey') || undefined;
    const pbpStr = p.get('pbp');
    const pbp = pbpStr ? Number(pbpStr) : undefined;

    set((prev) => ({
      ...prev,
      from,
      type: type || from || prev.type,
      tier: tier || level || prev.tier,
      level: level || tier || prev.level,
      tripperId,
      priceKey,
      pbp
    }));
  },

  setBasePrice: (price) => set({ basePricePerPerson: price }),
  setCurrency: (c) => set({ currency: c }),
}));