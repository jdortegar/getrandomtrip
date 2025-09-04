// frontend/src/lib/linking.ts

export function normalizeTierId(rawId: string) {
  let id = (rawId || '').toLowerCase();
  id = id.replace(/\s+/g, '-'); // "Modo Explora" -> "modo-explora"
  if (id === 'explora') id = 'modo-explora';
  if (id === 'exploraplus' || id === 'exploraPlus' || id === 'explora-plus') id = 'explora-plus';
  if (id === 'atelier-getaway') id = 'atelier';
  return id;
}

/** Extrae número de labels como "Hasta 350 USD", "450 USD", "Desde 1550 USD" */
export function parsePriceLabelToNumber(label: string): number {
  if (!label) return 0;
  // Quita palabras y símbolos, deja números y punto
  const cleaned = label.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

/** Navega a basic-config con params mínimos para que InitClient setee basePriceUsd */
export function gotoBasicConfig(
  router: any, // Se usa `any` para aceptar el router de `next/navigation` sin conflictos de tipo
  opts: {
    fromOrType: 'couple' | 'solo' | 'family' | 'group' | 'honeymoon' | 'paws';
    tierId: string; // id tal como aparece en la card (lo normalizamos adentro)
    priceLabel?: string; // "Hasta 350 USD" | "450 USD" | "Desde 1550 USD" ...
    extra?: Record<string, string>;
  },
) {
  const level = normalizeTierId(opts.tierId);
  const pbp = parsePriceLabelToNumber(opts.priceLabel || '');
  const query: Record<string, string> = {
    type: opts.fromOrType,
    level, // tu InitClient prioriza level/tier
  };
  if (pbp > 0) query.pbp = String(pbp); // “precio base por persona”
  if (opts.extra) Object.assign(query, opts.extra);

  const searchParams = new URLSearchParams(query);
  const href = `/journey/basic-config?${searchParams.toString()}`;

  router.push(href);
}
