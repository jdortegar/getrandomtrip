'use client';
import { useStore } from '@/store/store';
import { ADDONS } from '@/lib/data/addons-catalog';
import SelectedFiltersChips from './SelectedFiltersChips';
import Chip from '@/components/badge';
import { usePayment } from '@/hooks/usePayment';

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

  // Use consolidated payment hook for pricing calculations (DRY principle)
  const { calculateTotals } = usePayment({
    basePriceUsd: basePriceUsd || 0,
    logistics,
    filters,
    addons,
  });

  const {
    basePerPax,
    filtersPerPax,
    addonsPerPax,
    cancelInsurancePerPax,
    totalPerPax,
  } = calculateTotals();

  const safeDisplay =
    displayPrice && displayPrice.trim().length > 0
      ? displayPrice
      : `USD ${basePerPax.toFixed(0)}`;

  // Generate add-on chips with per-person pricing
  const addonChips = addons.selected
    .map((s) => {
      const a = ADDONS.find((x) => x.id === s.id);
      if (!a) return null;
      const qty = s.qty || 1;

      const valueText = qty > 1 ? `${a.title} ×${qty}` : a.title;

      // Calculate per-person price using consolidated logic
      let pricePerPax = 0;

      if (a.id === 'cancel-ins') {
        // Special case: cancellation insurance is 15% of subtotal
        pricePerPax = cancelInsurancePerPax;
      } else {
        const totalPrice = a.price * qty;

        if (a.type === 'perPax') {
          // For perPax addons, divide by quantity (which usually matches pax)
          pricePerPax = totalPrice / qty;
        } else {
          // For perTrip addons, divide by number of passengers
          pricePerPax = totalPrice / pax;
        }
      }

      return {
        id: s.id,
        category: a.category,
        value: valueText,
        price: pricePerPax,
        type: a.type,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    category: string;
    value: string;
    price: number;
    type: 'perPax' | 'perTrip';
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
                  value: `${addon.value} (USD $${addon.price})`,
                  onRemove: () => removeAddon(addon.id),
                }}
                color="primary"
              />
            ))}
          </div>

          <div className="text-base font-semibold">{`USD ${(addonsPerPax + cancelInsurancePerPax).toFixed(2)}`}</div>
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
