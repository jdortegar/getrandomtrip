import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { getTripCostDisplay } from "@/lib/helpers/trip-cost-display";

interface TripCostSummaryProps {
  copy: Pick<
    MarketingDictionary["tripDetail"],
    | "costsTitle"
    | "basePriceLabel"
    | "filtersCostLabel"
    | "addonsCostLabel"
    | "totalTripLabel"
    | "perPersonLabel"
    | "estimateNote"
  >;
  price: ReturnType<typeof getTripCostDisplay>;
}

export function TripCostSummary({ copy, price }: TripCostSummaryProps) {
  const amount = (value: number) =>
    `${price.currency.toUpperCase()} ${value.toFixed(2)}`;
  const lines = price.breakdown
    ? [
        { label: copy.basePriceLabel, value: price.breakdown.base },
        { label: copy.filtersCostLabel, value: price.breakdown.filters },
        { label: copy.addonsCostLabel, value: price.breakdown.addons },
      ]
    : [];
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
      <h3 className="mb-4 font-barlow-condensed text-lg font-extrabold uppercase leading-none text-ink">
        {copy.costsTitle}
      </h3>
      <div className="space-y-3">
        {lines.map(({ label, value }) => (
          <div
            className="flex justify-between items-center pb-3 border-b border-gray-200"
            key={label}
          >
            <span className="text-sm text-neutral-600">{label}</span>
            <span className="font-semibold text-ink">{amount(value)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm font-semibold text-ink">
            {copy.totalTripLabel}
            {price.isEstimate && (
              <span className="ml-1 text-xs font-normal text-neutral-400">
                {copy.estimateNote}
              </span>
            )}
          </span>
          <span className="text-xl font-bold text-secondary">
            {amount(price.total)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm text-neutral-600">
          <span>{copy.perPersonLabel}</span>
          <span className="font-medium">{amount(price.perPerson)}</span>
        </div>
      </div>
    </div>
  );
}
