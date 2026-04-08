'use client';

import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { enUS, es } from 'react-day-picker/locale';
import { cn } from '@/lib/utils';

function formatDateParam(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateParam(value: string | undefined) {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calendarDayTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isStrictlyBetween(date: Date, rangeFrom: Date, rangeTo: Date): boolean {
  const t = calendarDayTime(date);
  return (
    t > calendarDayTime(rangeFrom) && t < calendarDayTime(rangeTo)
  );
}

function dayPickerLocaleFromDocument() {
  try {
    const localeCode =
      typeof document !== 'undefined'
        ? document.documentElement.lang?.slice(0, 2) ?? 'es'
        : 'es';
    return localeCode === 'en' ? enUS : es;
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
      labelsProp?.availableFromHint ??
      'Fechas disponibles a partir de 7 días.',
    clearAll: labelsProp?.clearAll ?? 'Borrar todo',
    confirmDates: labelsProp?.confirmDates ?? 'Confirmar fechas',
    daysLabel: labelsProp?.daysLabel ?? 'días',
    nightsLabel: labelsProp?.nightsLabel ?? 'noches',
  };

  const dayPickerLocale = dayPickerLocaleFromDocument();

  const from = parseDateParam(startDate);
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
    notify(formatDateParam(date));
    onConfirm?.();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <div
          aria-label={`${tripNights + 1} ${labels.daysLabel}, ${tripNights} ${labels.nightsLabel}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm text-white shadow-sm',
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

      <div className="mt-4 rounded-lg border border-gray-300 bg-white p-4 text-center">
        <DayPicker
          classNames={{
            chevron: 'fill-primary',
            day: 'text-gray-500',
            selected:
              'bg-primary border-primary text-white rounded-full rounded-r-none',
            today: 'border-primary',
          }}
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
              'bg-primary border-primary text-white rounded-full rounded-l-none',
            journey_middle:
              'bg-primary border-primary rounded-none text-white',
          }}
          numberOfMonths={2}
          onSelect={handleSelect}
          selected={from}
        />
        <p className="mt-2 text-sm text-gray-500">
          {labels.availableFromHint}
        </p>
      </div>
      {/*
      <div className="mt-8 flex items-center justify-center gap-10 border-t border-gray-200 pt-6">
        <button
          className="text-sm font-medium text-gray-900 underline hover:no-underline"
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
