"use client";

import type { CSSProperties } from "react";
import {
  DayPicker,
  formatCaption,
  getDefaultClassNames,
} from "react-day-picker";
import "react-day-picker/dist/style.css";
import { enUS, es } from "react-day-picker/locale";
import { isTripStartDateEligible, parseTripCalendarDate } from "@/lib/helpers/tripCalendarDate";
import { cn } from "@/lib/utils";

const defaultClassNames = getDefaultClassNames();
// Match seven columns to the card's content width, not the viewport. Keep
// full-height targets when nested mobile padding leaves less than 308px.
const responsiveCalendarStyles = {
  "--rdp-day-height": "44px",
  "--rdp-day-width": "min(44px, calc(100cqi / 7))",
  "--rdp-day_button-height": "44px",
  "--rdp-day_button-width": "var(--rdp-day-width)",
} as CSSProperties;

const formatCapitalizedMonthCaption: typeof formatCaption = (
  month,
  options,
  dateLib,
) => {
  const caption = formatCaption(month, options, dateLib);
  return (
    caption.charAt(0).toLocaleUpperCase(options?.locale?.code) +
    caption.slice(1)
  );
};

function formatDateParam(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateParam(value: string | undefined) {
  const date = parseTripCalendarDate(value);
  return date ? new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) : undefined;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calendarDayTime(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function isStrictlyBetween(
  date: Date,
  rangeFrom: Date,
  rangeTo: Date,
): boolean {
  const t = calendarDayTime(date);
  return t > calendarDayTime(rangeFrom) && t < calendarDayTime(rangeTo);
}

function dayPickerLocaleFromDocument() {
  try {
    const localeCode =
      typeof document !== "undefined"
        ? (document.documentElement.lang?.slice(0, 2) ?? "es")
        : "es";
    return localeCode === "en" ? enUS : es;
  } catch {
    return es;
  }
}

export interface JourneyDatesPickerLabels {
  availableFromHint: string;
  clearAll: string;
  confirmDates: string;
  daysLabel?: string;
  nightsLabel?: string;
}

interface JourneyDatesPickerProps {
  labels?: JourneyDatesPickerLabels;
  maxNights: number;
  /** Ignored for display; duration is always `maxNights`. Parent still receives `maxNights` via callbacks. */
  nights: number;
  onConfirm?: () => void;
  onNightsChange: (nights: number) => void;
  onRangeChange?: (startDate: string | undefined, nights: number) => void;
  onStartDateChange: (startDate: string | undefined) => void;
  startDate: string | undefined;
}

export function JourneyDatesPicker({
  labels: labelsProp,
  maxNights,
  nights: _nights,
  onConfirm,
  onNightsChange,
  onRangeChange,
  onStartDateChange,
  startDate,
}: JourneyDatesPickerProps) {
  void _nights;
  const tripNights = Math.max(1, maxNights);

  const labels = {
    availableFromHint:
      labelsProp?.availableFromHint ?? "Fechas disponibles a partir de 7 días.",
    clearAll: labelsProp?.clearAll ?? "Borrar todo",
    confirmDates: labelsProp?.confirmDates ?? "Confirmar fechas",
    daysLabel: labelsProp?.daysLabel ?? "días",
    nightsLabel: labelsProp?.nightsLabel ?? "noches",
  };

  const dayPickerLocale = dayPickerLocaleFromDocument();

  const from = isTripStartDateEligible(startDate) ? parseDateParam(startDate) : undefined;
  const rangeEnd = from != null ? addDays(from, tripNights) : undefined;

  const notify = (newStart: string | undefined) => {
    if (onRangeChange) {
      onRangeChange(newStart, tripNights);
    } else {
      onStartDateChange(newStart);
      onNightsChange(tripNights);
    }
  };

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      notify(undefined);
      return;
    }
    if (!isTripStartDateEligible(formatDateParam(date))) return;
    notify(formatDateParam(date));
    onConfirm?.();
  };

  return (
    <div data-component="JourneyDatesPicker">
      <div className="flex flex-wrap gap-2">
        <div
          aria-label={`${tripNights + 1} ${labels.daysLabel}, ${tripNights} ${labels.nightsLabel}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm text-white shadow-sm",
          )}
        >
          <span className="font-semibold">
            {tripNights + 1} {labels.daysLabel}
          </span>
          <span className="opacity-80">
            / {tripNights} {labels.nightsLabel}
          </span>
        </div>
      </div>

      <div className="@container mt-4 rounded-lg border border-gray-300 bg-white p-4 text-center">
        <DayPicker
          classNames={{
            chevron: "fill-primary",
            day: cn(defaultClassNames.day, "text-gray-500"),
            selected:
              "bg-primary border-primary text-white rounded-full rounded-r-none",
            today: "border-primary",
          }}
          disabled={(date) => !isTripStartDateEligible(formatDateParam(date))}
          formatters={{ formatCaption: formatCapitalizedMonthCaption }}
          labels={{ labelGrid: formatCapitalizedMonthCaption }}
          locale={dayPickerLocale}
          mode="single"
          modifiers={{
            journey_end: rangeEnd ?? false,
            journey_middle: (date) =>
              from != null &&
              rangeEnd != null &&
              isStrictlyBetween(date, from, rangeEnd),
          }}
          modifiersClassNames={{
            journey_end:
              "bg-primary border-primary text-white rounded-full rounded-l-none",
            journey_middle: "bg-primary border-primary rounded-none text-white",
          }}
          numberOfMonths={2}
          onSelect={handleSelect}
          selected={from}
          style={responsiveCalendarStyles}
        />
        <p className="mt-2 text-sm text-gray-500">{labels.availableFromHint}</p>
      </div>
      {/*
      <div className="mt-8 flex items-center justify-center gap-10 border-t border-gray-200 pt-6">
        <button
          className="text-sm font-medium text-ink underline hover:no-underline"
          onClick={handleClearAll}
          type="button"
        >
          {labels.clearAll}
        </button>

        {canContinue ? (
          <Button
            className="text-sm font-normal normal-case"
            onClick={handleContinue}
            size="md"
            type="button"
            variant="default"
          >
            {labels.confirmDates}
          </Button>
        ) : null}
      </div>
      */}
    </div>
  );
}
