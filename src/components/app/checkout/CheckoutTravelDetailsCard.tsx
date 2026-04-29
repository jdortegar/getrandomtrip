"use client";

import type { ReactNode } from "react";

import Img from "@/components/common/Img";
import { CheckoutIconValueCard } from "@/components/app/checkout/CheckoutIconValueCard";
import { CheckoutPricingSummary } from "@/components/app/checkout/CheckoutPricingSummary";
import { CheckoutTravelersSummarySection } from "@/components/app/checkout/CheckoutTravelersSummarySection";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import { cn } from "@/lib/utils";

export interface CheckoutIconDetailRow {
  className?: string;
  icon?: ReactNode;
  id: string;
  label: ReactNode;
  value: ReactNode;
  valueLayout?: "chips" | "default";
}

interface CheckoutTravelTypeInfo {
  image?: string;
  label?: string;
  rating: number;
  reviews: number;
}

interface CheckoutTravelDetailsCardProps {
  addonsPerPaxCombined: number;
  appliedPromocode: string | null;
  basePerPax: number;
  checkoutCopy: Dictionary["journey"]["checkout"];
  checkoutIconDetailRows: CheckoutIconDetailRow[];
  checkoutItemTileClass: string;
  checkoutItemTileLabelClass: string;
  filterFeeDescription: string;
  filterFeePaxLine: string;
  filtersPerPax: number;
  onApplyPromocode: () => void;
  onPromocodeChange: (value: string) => void;
  onRemovePromocode: () => void;
  onSaveTravelers: (nextDetails: PaxDetails) => Promise<void>;
  onTogglePromocodeInput: () => void;
  partyEditable: boolean;
  paxDetails: PaxDetails;
  pricePerPerson: number;
  promoDiscount: number;
  promoError: string | null;
  promoLoading: boolean;
  promocode: string;
  ratingFormatted: string | null;
  selectedExperienceLabel?: string;
  selectedTravelTypeInfo: CheckoutTravelTypeInfo | null;
  showPromocodeInput: boolean;
  summary: Dictionary["journey"]["summary"];
  totalPerPax: number;
  totalTrip: number;
  usd: (value: number) => string;
}

export function CheckoutTravelDetailsCard({
  addonsPerPaxCombined,
  appliedPromocode,
  basePerPax,
  checkoutCopy,
  checkoutIconDetailRows,
  checkoutItemTileClass,
  checkoutItemTileLabelClass,
  filterFeeDescription,
  filterFeePaxLine,
  filtersPerPax,
  onApplyPromocode,
  onPromocodeChange,
  onRemovePromocode,
  onSaveTravelers,
  onTogglePromocodeInput,
  partyEditable,
  paxDetails,
  pricePerPerson,
  promoDiscount,
  promoError,
  promoLoading,
  promocode,
  ratingFormatted,
  selectedExperienceLabel,
  selectedTravelTypeInfo,
  showPromocodeInput,
  summary,
  totalPerPax,
  totalTrip,
  usd,
}: CheckoutTravelDetailsCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md lg:col-span-1",
        "ring-1 ring-gray-100",
      )}
    >
      <h2 className="mb-4 font-barlow-condensed text-4xl font-bold uppercase">
        {checkoutCopy.travelDetailsTitle}
      </h2>

      <div className="flex gap-4">
        <div className="h-64 w-48 shrink-0 overflow-hidden rounded-2xl">
          {selectedTravelTypeInfo?.image ? (
            <Img
              alt={selectedTravelTypeInfo?.label}
              className="h-full w-full object-cover"
              height={128}
              src={selectedTravelTypeInfo.image}
              width={96}
            />
          ) : null}
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div>
            <p className="font-barlow text-2xl font-bold">
              <span>{summary?.travelTypeSection}</span>
              <span className="px-1.5">{checkoutCopy.travelTypeTitleSeparator}</span>
              <span className="text-sky-600">{selectedTravelTypeInfo?.label}</span>
            </p>
            <p className="font-barlow text-lg font-normal text-gray-500">
              {summary?.experienceSection}{" "}
              <span className="font-bold">{selectedExperienceLabel}</span>
            </p>
          </div>
          <div>
            <p className="text-base text-gray-500">
              {checkoutCopy.summaryHeroPriceCaption}
            </p>
            <p className="font-barlow-condensed text-3xl font-bold text-gray-900">
              {usd(pricePerPerson)}
            </p>
          </div>
          {ratingFormatted != null ? (
            <p className="text-base font-normal text-gray-500">
              {summary?.favoriteAmongTravelers}
              {ratingFormatted}
              {selectedTravelTypeInfo?.reviews != null &&
                ` (${selectedTravelTypeInfo.reviews})`}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-2 font-barlow text-lg text-gray-500">
        {checkoutCopy.itemsDescription}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {checkoutIconDetailRows.map((row) => (
          <CheckoutIconValueCard
            className={row.className}
            icon={row.icon}
            key={row.id}
            title={row.label}
            value={row.value}
            valueLayout={row.valueLayout}
          />
        ))}

        <CheckoutTravelersSummarySection
          checkoutCopy={checkoutCopy}
          onSaveTravelers={onSaveTravelers}
          partyEditable={partyEditable}
          paxDetails={paxDetails}
          tileClassName={checkoutItemTileClass}
          tileLabelClassName={checkoutItemTileLabelClass}
        />
      </div>

      <CheckoutPricingSummary
        addonsPerPaxCombined={addonsPerPaxCombined}
        appliedPromocode={appliedPromocode}
        basePerPax={basePerPax}
        checkoutCopy={checkoutCopy}
        filterFeeDescription={filterFeeDescription}
        filterFeePaxLine={filterFeePaxLine}
        filtersPerPax={filtersPerPax}
        onApplyPromocode={onApplyPromocode}
        onPromocodeChange={onPromocodeChange}
        onRemovePromocode={onRemovePromocode}
        onTogglePromocodeInput={onTogglePromocodeInput}
        promoDiscount={promoDiscount}
        promoError={promoError}
        promoLoading={promoLoading}
        promocode={promocode}
        showPromocodeInput={showPromocodeInput}
        totalPerPax={totalPerPax}
        totalTrip={totalTrip}
        usd={usd}
      />
    </div>
  );
}
