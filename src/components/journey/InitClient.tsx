'use client';
import { useEffect, useMemo } from 'react';
import { useJourneyStore } from '@/store/journeyStore';
import { parseBasePrice } from '@/lib/levels';
import pricingCatalog from '@/data/pricing-catalog.json' assert { type: 'json' };

// Normaliza strings de nivel para que coincidan con las claves del catálogo
function normTier(raw?: string) {
  if (!raw) return undefined;
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace('explora+', 'explora-plus') as
    | 'essenza'
    | 'modo-explora'
    | 'explora-plus'
    | 'bivouac'
    | 'atelier'
    | undefined;
}

type Props = {
  searchParams: Record<string, string>;
  displayPrice?: string;
};

export default function InitClient({ searchParams, displayPrice }: Props) {
  const setPartial = useJourneyStore((s) => s.setPartial);

  // 1) Leemos y normalizamos parámetros de entrada
  const params = useMemo(() => {
    const sp = new URLSearchParams(searchParams as any);

    // Compatibilidad: si viene price en la URL original (por ejemplo desde una card)
    if (displayPrice && !sp.get('pbp')) {
      // displayPrice podría venir como "USD 350" o "350", lo parseamos con tu helper
      const parsed = parseBasePrice(displayPrice);
      if (!Number.isNaN(parsed) && parsed > 0) sp.set('pbp', String(parsed));
    }

    const from = (sp.get('from') || '') as 'tripper' | '' | 'couple' | 'solo' | 'family' | 'group' | 'honeymoon' | 'paws';
    const type = (sp.get('type') || '') as 'couple' | 'solo' | 'family' | 'group' | 'honeymoon' | 'paws' | '';
    const level = normTier(sp.get('level') || undefined);
    const tier = normTier(sp.get('tier') || undefined);
    const tripperId = sp.get('tripperId') || undefined;
    const priceKey = sp.get('priceKey') || undefined;
    const pbp = sp.get('pbp') ? Number(sp.get('pbp')) : undefined;

    return {
      from: (from || '') as any,
      type: (type || (from || 'couple')) as any, // por compatibilidad con tu default 'couple'
      tier: tier || level,
      level: level || tier,
      tripperId,
      priceKey,
      pbp,
    };
  }, [searchParams, displayPrice]);

  // 2) Resolver el precio base por persona con prioridades
  useEffect(() => {
    const {
      type, from, tier, level, tripperId, priceKey, pbp,
    } = params;

    // prioridad (1): pbp directo (o displayPrice parseado)
    if (typeof pbp === 'number' && !Number.isNaN(pbp) && pbp > 0) {
      setPartial({
        from: (from as any) || '',
        type: (type as any) || 'couple',
        level: (level as any) || (tier as any) || 'modo-explora',
        displayPrice: `USD ${pbp.toFixed(0)}`,
        basePriceUsd: pbp,
      });
      return;
    }

    // Determinar tier efectivo
    const effectiveTier = (level || tier) as keyof (typeof pricingCatalog)['byTraveller']['couple'] | undefined;

    // Helper para leer del catálogo byTraveller
    const fromOrType = (type || from || 'couple') as keyof typeof pricingCatalog.byTraveller;

    const getFromByTraveller = () => {
      if (!effectiveTier) return undefined;
      const byT = pricingCatalog.byTraveller?.[fromOrType] as Record<string, { base: number }> | undefined;
      const v = byT?.[effectiveTier]?.base;
      return typeof v === 'number' ? v : undefined;
    };

    // Helper para leer del catálogo de trippers
    const getFromTripper = () => {
      if (!tripperId || !effectiveTier) return undefined;
      const tcat = (pricingCatalog.trippers as any)?.[tripperId] as Record<string, { base: number }> | undefined;
      const v = tcat?.[effectiveTier]?.base;
      return typeof v === 'number' ? v : undefined;
    };

    // prioridad (2): priceKey explícito
    if (priceKey) {
      try {
        const [root, ttype, ttier] = priceKey.split('.');
        if (root === 'byTraveller') {
          const byT = (pricingCatalog.byTraveller as any)?.[ttype];
          const v = byT?.[ttier]?.base;
          if (typeof v === 'number') {
            setPartial({
              from: (from as any) || '',
              type: (type as any) || 'couple',
              level: (level as any) || (tier as any) || 'modo-explora',
              displayPrice: `USD ${v.toFixed(0)}`,
              basePriceUsd: v,
            });
            return;
          }
        }
        if (root === 'trippers' && tripperId) {
          const tcat = (pricingCatalog.trippers as any)?.[tripperId];
          const v = tcat?.[ttier]?.base;
          if (typeof v === 'number') {
            setPartial({
              from: (from as any) || '',
              type: (type as any) || 'couple',
              level: (level as any) || (tier as any) || 'modo-explora',
              displayPrice: `USD ${v.toFixed(0)}`,
              basePriceUsd: v,
            });
            return;
          }
        }
      } catch {
        // ignoramos errores del key mal formado
      }
    }

    // prioridad (3): trippers override
    const tripperPrice = getFromTripper();
    if (typeof tripperPrice === 'number') {
      setPartial({
        from: (from as any) || '',
        type: (type as any) || 'couple',
        level: (level as any) || (tier as any) || 'modo-explora',
        displayPrice: `USD ${tripperPrice.toFixed(0)}`,
        basePriceUsd: tripperPrice,
      });
      return;
    }

    // prioridad (4): byTraveller
    const byTravellerPrice = getFromByTraveller();
    if (typeof byTravellerPrice === 'number') {
      setPartial({
        from: (from as any) || '',
        type: (type as any) || 'couple',
        level: (level as any) || (tier as any) || 'modo-explora',
        displayPrice: `USD ${byTravellerPrice.toFixed(0)}`,
        basePriceUsd: byTravellerPrice,
      });
      return;
    }

    // fallback
    setPartial({
      from: (from as any) || '',
      type: (type as any) || 'couple',
      level: (level as any) || (tier as any) || 'modo-explora',
      displayPrice: '',
      basePriceUsd: 0,
    });
  }, [params, setPartial]);

  return null;
}
