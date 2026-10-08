"use client";

import { CalendarDays, MapPin, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getXsedPricePerPerson } from "@/lib/data/traveler-types";
import { getNextWeekend } from "@/lib/helpers/xsed-dates";
import type { ResolvedExcuseSelection } from "@/lib/helpers/excuse-helper";
import type { XsedBookDict } from "@/lib/types/dictionary";
import type { XsedTravelType } from "@/types/core";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDay(
  date: Date,
  days: string[],
  months: string[],
): string {
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function fillCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface XsedSummaryProps {
  /** Product name (hero brand: XSED / TGIS). */
  brand: string;
  copy: XsedBookDict["summary"];
  /** Localized excuse + refine labels; null until an excuse is chosen. */
  excuse: ResolvedExcuseSelection | null;
  onEdit: (section: string) => void;
  originCity: string;
  originCountry: string;
  pax: number;
  travelType: XsedTravelType | "";
  travelTypeLabel: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function XsedSummary({
  brand,
  copy,
  excuse,
  onEdit,
  originCity,
  originCountry,
  pax,
  travelType,
  travelTypeLabel,
}: XsedSummaryProps) {
  const pricePerPerson = getXsedPricePerPerson(travelType);
  const total = pricePerPerson * pax;
  const { saturday, sunday } = getNextWeekend();

  const peopleText = fillCount(
    pax === 1 ? copy.personOne : copy.personOther,
    pax,
  );

  const sectionTitleClass = "text-base font-bold text-ink";
  const detailClass = "text-sm font-normal text-ink";
  const actionButtonClass =
    "shrink-0 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-normal text-ink hover:bg-gray-200";

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start lg:w-80" data-component="XsedSummary">
      <h2 className="text-xl font-bold text-ink">{copy.title}</h2>

      {/* Product */}
      <div className="border-b border-gray-200 pb-4">
        <p className={sectionTitleClass}>{copy.productLabel}</p>
        <div className="mt-2">
          <p className={cn("font-bold", detailClass)}>{brand}</p>
          <p className="text-sm font-normal text-gray-500 mt-0.5">
            {copy.productDetail}
          </p>
        </div>
      </div>

      {/* Date */}
      <div className="border-b border-gray-200 pb-4">
        <p className={sectionTitleClass}>{copy.dateLabel}</p>
        <div className="mt-2 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-ink" />
          <p className={detailClass}>
            {formatDay(saturday, copy.days, copy.months)} ·{" "}
            {formatDay(sunday, copy.days, copy.months)}
          </p>
        </div>
      </div>

      {/* Origin */}
      <div className="border-b border-gray-200 pb-4">
        <p className={sectionTitleClass}>{copy.originLabel}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          {originCity && originCountry ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-ink" />
                <p className={detailClass}>
                  {originCity}, {originCountry}.
                </p>
              </div>
              <button
                className={actionButtonClass}
                onClick={() => onEdit("origin")}
                type="button"
              >
                {copy.change}
              </button>
            </>
          ) : (
            <div className="flex w-full justify-end">
              <button
                className={actionButtonClass}
                onClick={() => onEdit("origin")}
                type="button"
              >
                {copy.add}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Travelers */}
      <div className="border-b border-gray-200 pb-4">
        <p className={sectionTitleClass}>{copy.peopleLabel}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={detailClass}>
            {travelTypeLabel ? `${travelTypeLabel} · ` : ""}
            {peopleText}
          </p>
          <button
            className={actionButtonClass}
            onClick={() => onEdit("pax")}
            type="button"
          >
            {copy.change}
          </button>
        </div>
      </div>

      {/* Excuse */}
      <div className="border-b border-gray-200 pb-4" data-section="excuse">
        <p className={sectionTitleClass}>{copy.excuseLabel}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={detailClass}>{excuse?.title ?? copy.excuseEmpty}</p>
            {excuse && excuse.refineDetails.length > 0 ? (
              <p className="mt-0.5 text-sm font-normal text-gray-500">
                {excuse.refineDetails.map((detail) => detail.label).join(", ")}
              </p>
            ) : null}
          </div>
          <button
            className={actionButtonClass}
            onClick={() => onEdit("excuse")}
            type="button"
          >
            {excuse ? copy.change : copy.add}
          </button>
        </div>
      </div>

      {/* Totals */}
      <div>
        <div className="flex gap-4 items-start justify-between">
          <p className="font-barlow font-semibold text-sm text-ink">
            {copy.pricePerPerson}
          </p>
          <p className="shrink-0 text-right font-barlow-condensed font-bold text-lg text-ink">
            USD {pricePerPerson}
          </p>
        </div>

        <div className="border-gray-200 border-t flex gap-4 items-start justify-between mt-5 pt-4">
          <div className="min-w-0 flex-1">
            <p className="font-barlow-condensed font-bold text-3xl text-ink">
              {copy.total}
            </p>
            <p className="mt-1 font-barlow font-normal text-gray-600 text-sm">
              {peopleText}
            </p>
          </div>
          <p className="shrink-0 text-right font-barlow-condensed font-bold text-3xl text-ink">
            USD {total}
          </p>
        </div>
      </div>

      {/* Important */}
      <div className="rounded-lg bg-[#E8F4FC] p-4 text-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkle
            aria-hidden
            className="h-4 w-4 shrink-0 text-[#5B7A8C] fill-[#5B7A8C]"
          />
          <span className="text-base font-bold text-ink">{copy.importantTitle}</span>
        </div>
        <ul className="list-outside list-disc pl-4 space-y-1 text-sm font-normal text-ink">
          {copy.importantItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
