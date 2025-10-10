'use client';
import { useStore } from '@/store/store';
import {
  computeFiltersCostPerTrip,
  computeAddonsCostPerTrip,
} from '@/lib/pricing';
import { ADDONS } from '@/data/addons-catalog';
import SelectedFiltersChips from './SelectedFiltersChips';
import Chip from '@/components/badge';

export default function SummaryCard() {
  const {
    displayPrice,
    basePriceUsd,
    logistics,
    filters,
    addons,
    activeTab,
    setPartial,
    removeAddon,
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

  // Generate add-on chips
  const addonChips = addons.selected
    .map((s) => {
      const a = ADDONS.find((x) => x.id === s.id);
      if (!a) return null;
      const qty = s.qty || 1;

      const titleWithOption =
        a.title +
        (s.optionId
          ? ` · ${a.options?.find((o) => o.id === s.optionId)?.label}`
          : '');

      const valueText =
        qty > 1 ? `${titleWithOption} ×${qty}` : titleWithOption;

      return {
        id: s.id,
        category: a.category,
        value: valueText,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    category: string;
    value: string;
  }>;
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
          <SelectedFiltersChips />

          <div className="text-base font-semibold">{`USD ${filtersPerPax.toFixed(2)}`}</div>
        </div>
        <div className="max-w-[200px] mx-auto">
          <div className="mb-2 flex items-center justify-center w-full mx-auto">
            <span className="text-xs text-neutral-600 font-medium">
              Add-ons ({addonChips.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center py-2">
            {addonChips.map((addon) => (
              <Chip
                key={addon.id}
                item={{
                  key: addon.id,
                  label: addon.category,
                  value: addon.value,
                  onRemove: () => removeAddon(addon.id),
                }}
                color="primary"
              />
            ))}
            {/* {cancelCost > 0 && (
              <Chip
                item={{
                  key: 'cancel-insurance',
                  label: 'Seguridad',
                  value: 'Seguro cancelación',
                  onRemove: () => removeAddon('cancel-ins'),
                }}
              />
            )} */}
          </div>

          <div className="text-base font-semibold">{`USD ${addonsPerPax.toFixed(2)}`}</div>
        </div>
        <div className="border-t my-2"></div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-600 font-medium">
            Total por persona
          </label>
          <div className="text-base font-bold">{`USD ${totalPerPax.toFixed(2)}`}</div>
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
