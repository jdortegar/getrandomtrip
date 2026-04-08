// frontend/src/lib/pricing.ts
import { ADDONS, Addon } from '@/lib/data/shared/addons-catalog';
import { countOptionalFilters } from '@/lib/helpers/journey';

export function computeFiltersCostPerTrip(
  filters: any,
  pax: number,
  avoidCount = 0,
): number {
  const optional = countOptionalFilters(filters, avoidCount);
  let unit = 0;
  if (optional >= 2 && optional <= 3) unit = 18;
  if (optional >= 4) unit = 25;
  const total = Math.max(0, optional - 1) * unit * (pax || 1);
  return total;
}

/** Billable count, tier unit, and totals — matches `computeFiltersCostPerTrip` (checkout breakdown). */
export function getFiltersCostBreakdown(
  filters: any,
  pax: number,
  avoidCount = 0,
): {
  billable: number;
  optional: number;
  perPax: number;
  tierUnit: number;
  tripTotal: number;
} {
  const optional = countOptionalFilters(filters, avoidCount);
  let tierUnit = 0;
  if (optional >= 2 && optional <= 3) tierUnit = 18;
  if (optional >= 4) tierUnit = 25;
  const billable = Math.max(0, optional - 1);
  const paxN = pax || 1;
  const tripTotal = computeFiltersCostPerTrip(filters, paxN, avoidCount);
  return {
    billable,
    optional,
    perPax: paxN ? tripTotal / paxN : 0,
    tierUnit,
    tripTotal,
  };
}

type Sel = { id: string; qty: number };

/** retorna costo de add-ons por VIAJE (total, no per pax) */
export function computeAddonsCostPerTrip(
  selections: Sel[],
  basePerPax: number,
  filtersPerTrip: number,
  pax: number,
) {
  const paxN = pax || 1;
  const others = selections.filter((s) => s.id !== 'cancel-ins');
  let otherTotal = 0;

  for (const sel of others) {
    const a = ADDONS.find((x) => x.id === sel.id);
    if (!a) continue;
    const unitPrice = a.price;
    // All addons are now per-trip pricing (simplified model)
    otherTotal += unitPrice * (sel.qty || 1);
  }

  // costo por pax antes de cancel-ins
  const filtersPerPax = filtersPerTrip / paxN || 0;
  const subtotalPerPax = basePerPax + filtersPerPax + otherTotal / paxN;

  // cancel-ins = 15% del subtotal (por pax), luego multiplicar por pax
  const hasCancel = selections.find((s) => s.id === 'cancel-ins');
  const cancelCost = hasCancel ? Math.round(subtotalPerPax * 0.15 * paxN) : 0;

  const totalTrip = otherTotal + cancelCost;
  return { otherTotal, cancelCost, totalTrip };
}

/** Fallback mínimo requerido por FiltersPanel */
export function computeFiltersCost(
  _filters: any,
  _logistics: any,
  basePriceUsd: number | undefined,
): number {
  // Si no hay base, 0; si hay base, devolverla (no rompe UI).
  return typeof basePriceUsd === 'number' ? basePriceUsd : 0;
}
