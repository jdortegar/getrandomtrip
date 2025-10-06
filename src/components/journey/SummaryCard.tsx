'use client';
import { useStore } from '@/store/store';
import {
  computeFiltersCostPerTrip,
  computeAddonsCostPerTrip,
} from '@/lib/pricing';
import { ADDONS } from '@/data/addons-catalog';
import SelectedFiltersChips from './SelectedFiltersChips';

export default function SummaryCard() {
  const {
    displayPrice,
    basePriceUsd,
    logistics,
    filters,
    addons,
    activeTab,
    setPartial,
  } = useStore();

  const pax = logistics.pax || 1;

  const filtersTrip = computeFiltersCostPerTrip(filters, pax);
  const { totalTrip: addonsTrip, cancelCost } = computeAddonsCostPerTrip(
    addons.selected,
    basePriceUsd || 0,
    filtersTrip || 0,
    pax,
  );

  const basePerPax = basePriceUsd || 0;
  const filtersPerPax = pax > 0 ? filtersTrip / pax : 0;
  const addonsPerPax = pax > 0 ? addonsTrip / pax : 0;
  const totalPerPax = basePerPax + filtersPerPax + addonsPerPax;

  const safeDisplay =
    displayPrice && displayPrice.trim().length > 0
      ? displayPrice
      : `USD ${basePerPax.toFixed(0)}`;

  return (
    <div className="rounded-md bg-white/95 text-gray-900 ring-1 ring-neutral-200 shadow-sm p-4 font-jost">
      <h4 className="font-semibold mb-3">Resumen del Viaje</h4>
      <div className="space-y-3 text-sm">
        <div className="space-y-1">
          <label className="text-xs text-neutral-600 font-medium">
            Precio base tope por persona
          </label>
          <div className="text-base font-semibold">{safeDisplay}</div>
        </div>
        <div className="space-y-1">
          {activeTab !== 'logistics' && <SelectedFiltersChips />}
          <div className="text-base">{`USD ${filtersPerPax.toFixed(2)}`}</div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-600 font-medium">
            Add-ons
          </label>
          <div className="text-base">
            {`USD ${addonsPerPax.toFixed(2)}`}{' '}
            {cancelCost > 0 && (
              <span className="text-xs text-neutral-500">
                (incl. Seguro de cancelación)
              </span>
            )}
          </div>
        </div>
        <div className="border-t my-2"></div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-600 font-medium">
            Total por persona
          </label>
          <div className="text-base font-semibold">{`USD ${totalPerPax.toFixed(2)}`}</div>
        </div>
      </div>

      {/* {activeTab === 'preferences' && (
        <button
          type="button"
          onClick={() => setPartial({ activeTab: 'avoid' })}
          className="mt-4 w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white py-2.5 font-medium"
        >
          Ir a Destinos a evitar
        </button>
      )} */}
    </div>
  );
}
