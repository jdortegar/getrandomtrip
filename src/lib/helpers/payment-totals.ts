import { ADDONS } from '@/lib/data/shared/addons-catalog';
import { computeFiltersCostPerTrip } from '@/lib/pricing';
import type {
  AddonSelection,
  Filters,
  Logistics,
} from '@/store/slices/journeyStore';

/** Same shape as `usePayment` input — pure totals (no React). */
export interface PaymentTotalsInput {
  addons: { selected: AddonSelection[] };
  avoidCount?: number;
  basePriceUsd: number;
  filters: Filters;
  logistics: Logistics;
}

export interface PaymentTotalsResult {
  addonsPerPax: number;
  basePerPax: number;
  cancelInsurancePerPax: number;
  filtersPerPax: number;
  totalPerPax: number;
  totalTrip: number;
}

/** Mirrors `usePayment`’s `calculateTotals` for reuse on server/dashboard. */
export function calculatePaymentTotals(
  data: PaymentTotalsInput,
): PaymentTotalsResult {
  const { addons, avoidCount = 0, basePriceUsd, filters, logistics } = data;
  const pax = logistics.pax || 1;
  const basePerPax = basePriceUsd || 0;

  const filtersTripTotal = computeFiltersCostPerTrip(filters, pax, avoidCount);
  const filtersPerPax = filtersTripTotal / pax;

  let addonsPerPax = 0;
  const hasCancelInsurance = addons.selected.some((s) => s.id === 'cancel-ins');

  addons.selected.forEach((s) => {
    const a = ADDONS.find((x) => x.id === s.id);
    if (!a || a.id === 'cancel-ins') return;

    const qty = s.qty || 1;
    const totalPrice = a.price * qty;

    if (a.type === 'perPax') {
      addonsPerPax += totalPrice / qty;
    } else {
      addonsPerPax += totalPrice / pax;
    }
  });

  const subtotalPerPax = basePerPax + filtersPerPax + addonsPerPax;
  const cancelInsurancePerPax = hasCancelInsurance ? subtotalPerPax * 0.15 : 0;
  const totalAddonsPerPax = addonsPerPax + cancelInsurancePerPax;
  const totalPerPax = basePerPax + filtersPerPax + totalAddonsPerPax;
  const totalTrip = totalPerPax * pax;

  return {
    addonsPerPax,
    basePerPax,
    cancelInsurancePerPax,
    filtersPerPax,
    totalPerPax,
    totalTrip,
  };
}
