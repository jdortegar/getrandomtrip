// frontend/src/lib/pricing.ts
import { ADDONS, Addon } from '@/data/addons-catalog'
import { countOptionalFilters } from '@/store/journeyStore'

export function computeFiltersCostPerTrip(filters: any, pax: number): number {
  const optional = countOptionalFilters(filters)
  let unit = 0
  if (optional >= 2 && optional <= 3) unit = 18
  if (optional >= 4) unit = 25
  const total = Math.max(0, optional - 1) * unit * (pax || 1)
  return total
}

type Sel = { id: string; qty: number; optionId?: string }

function priceOf(addon: Addon, optionId?: string): number {
  const delta = addon.options?.find(o => o.id === optionId)?.deltaUsd ?? 0
  return addon.priceUsd + delta
}

/** retorna costo de add-ons por VIAJE (total, no per pax) */
export function computeAddonsCostPerTrip(
  selections: Sel[],
  basePerPax: number,
  filtersPerTrip: number,
  pax: number
) {
  const paxN = pax || 1
  const others = selections.filter(s => s.id !== 'cancel-ins')
  let otherTotal = 0

  for (const sel of others) {
    const a = ADDONS.find(x => x.id === sel.id)
    if (!a) continue
    const unitPrice = priceOf(a, sel.optionId)
    if (a.unit === 'per_pax') otherTotal += unitPrice * paxN * (sel.qty || 1)
    if (a.unit === 'per_trip') otherTotal += unitPrice * (sel.qty || 1)
  }

  // costo por pax antes de cancel-ins
  const filtersPerPax = (filtersPerTrip / paxN) || 0
  const subtotalPerPax = basePerPax + filtersPerPax + (otherTotal / paxN)

  // cancel-ins = 15% del subtotal (por pax), luego multiplicar por pax
  const hasCancel = selections.find(s => s.id === 'cancel-ins')
  const cancelCost = hasCancel ? Math.round(subtotalPerPax * 0.15 * paxN) : 0

  const totalTrip = otherTotal + cancelCost
  return { otherTotal, cancelCost, totalTrip }
}