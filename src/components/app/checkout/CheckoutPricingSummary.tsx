"use client";

import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface CheckoutPricingSummaryProps {
  addonsPerPaxCombined: number;
  appliedPromocode: string | null;
  basePerPax: number;
  checkoutCopy: Dictionary["journey"]["checkout"];
  filterFeeDescription: string;
  filterFeePaxLine: string;
  filtersPerPax: number;
  onApplyPromocode: () => void;
  onPromocodeChange: (value: string) => void;
  onRemovePromocode: () => void;
  onTogglePromocodeInput: () => void;
  promocode: string;
  showPromocodeInput: boolean;
  totalPerPax: number;
  totalTrip: number;
  usd: (value: number) => string;
}

export function CheckoutPricingSummary({
  addonsPerPaxCombined,
  appliedPromocode,
  basePerPax,
  checkoutCopy,
  filterFeeDescription,
  filterFeePaxLine,
  filtersPerPax,
  onApplyPromocode,
  onPromocodeChange,
  onRemovePromocode,
  onTogglePromocodeInput,
  promocode,
  showPromocodeInput,
  totalPerPax,
  totalTrip,
  usd,
}: CheckoutPricingSummaryProps) {
  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <div className="flex items-start justify-between gap-4">
        <p className="font-barlow text-lg font-bold text-gray-900">
          {checkoutCopy.summaryHeroPriceCaption}
        </p>
        <p className="shrink-0 text-right font-barlow-condensed text-xl font-bold text-gray-900">
          {usd(basePerPax)}
        </p>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-barlow text-base font-bold text-gray-900">
            {checkoutCopy.filterFeeLabel}
          </p>
          <p className="mt-1 font-barlow text-sm font-normal text-gray-600">
            {filterFeeDescription}
          </p>
        </div>
        <p className="shrink-0 text-right font-barlow-condensed text-xl font-bold text-gray-900">
          {usd(filtersPerPax)}
        </p>
      </div>

      {addonsPerPaxCombined > 0 ? (
        <div className="mt-4 flex items-start justify-between gap-4">
          <p className="font-barlow text-lg font-bold text-gray-900">
            {checkoutCopy.addonsPerPersonLabel}
          </p>
          <p className="shrink-0 text-right font-barlow-condensed text-xl font-bold text-gray-900">
            {usd(addonsPerPaxCombined)}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex items-start justify-between gap-4 border-t border-gray-200 pt-3">
        <p className="font-barlow text-lg font-bold text-gray-900">
          {checkoutCopy.subtotalPerPersonLabel}
        </p>
        <p className="shrink-0 text-right font-barlow-condensed text-xl font-bold text-gray-900">
          {usd(totalPerPax)}
        </p>
      </div>

      <div className="mt-4">
        {!showPromocodeInput && !appliedPromocode ? (
          <Button
            className="px-0 text-gray-700 hover:text-gray-900"
            onClick={onTogglePromocodeInput}
            size="sm"
            type="button"
            variant="link"
          >
            Add promocode
          </Button>
        ) : null}

        {showPromocodeInput ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              onChange={(event) => onPromocodeChange(event.target.value)}
              placeholder="Enter promocode"
              type="text"
              value={promocode}
            />
            <Button onClick={onApplyPromocode} size="sm" type="button">
              Add
            </Button>
          </div>
        ) : null}

        {appliedPromocode ? (
          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-barlow text-base font-semibold text-emerald-700">
                {appliedPromocode}
              </p>
              <Button
                className="h-auto p-0 text-gray-700 hover:text-gray-900"
                onClick={onRemovePromocode}
                size="sm"
                type="button"
                variant="link"
              >
                Remove promocode
              </Button>
            </div>
            <p className="shrink-0 text-right font-barlow-condensed text-xl font-bold text-emerald-700">
              {`- ${usd(totalTrip)}`}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 border-t border-gray-200 pt-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-end gap-1 font-barlow-condensed text-3xl font-bold text-gray-900">
            {checkoutCopy.totalLabel}
            <span className="mt-1 font-barlow text-lg font-normal text-gray-600">
              {filterFeePaxLine}
            </span>
          </p>
        </div>
        <p className="shrink-0 text-right font-barlow-condensed text-3xl font-bold text-gray-900">
          {usd(totalTrip)}
        </p>
      </div>
    </div>
  );
}
