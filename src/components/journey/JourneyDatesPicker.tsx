'use client';

import { useMemo } from 'react';
import type { DateRange } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { es } from 'react-day-picker/locale';
import Chip from '@/components/Chip';
import { Button } from '@/components/ui/Button';

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

function differenceInDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcA - utcB) / (24 * 60 * 60 * 1000));
}

interface JourneyDatesPickerProps {
  maxNights: number;
  nights: number;
  onConfirm?: () => void;
  onNightsChange: (nights: number) => void;
  onRangeChange?: (startDate: string | undefined, nights: number) => void;
  onStartDateChange: (startDate: string | undefined) => void;
  startDate: string | undefined; // yyyy-mm-dd
}

export function JourneyDatesPicker({
  maxNights,
  nights,
  onConfirm,
  onNightsChange,
  onRangeChange,
  onStartDateChange,
  startDate,
}: JourneyDatesPickerProps) {
  const selectedRange = useMemo((): DateRange | undefined => {
    const from = parseDateParam(startDate);
    if (!from) return undefined;
    const to = addDays(from, nights);
    return { from, to };
  }, [startDate, nights]);

  const options = useMemo(
    () => Array.from({ length: Math.max(1, maxNights) }, (_, i) => i + 1),
    [maxNights],
  );

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      if (onRangeChange) onRangeChange(undefined, 1);
      else onStartDateChange(undefined);
      return;
    }
    const newStart = formatDateParam(range.from);
    const n = range.to
      ? Math.max(1, Math.min(maxNights, differenceInDays(range.to, range.from)))
      : 1;
    if (onRangeChange) {
      onRangeChange(newStart, n);
    } else {
      onStartDateChange(newStart);
      onNightsChange(n);
    }
  };

  const canContinue = Boolean(startDate && nights >= 1);

  const handleClearAll = () => {
    if (onRangeChange) onRangeChange(undefined, 1);
    else {
      onStartDateChange(undefined);
      onNightsChange(1);
    }
  };

  const handleContinue = () => {
    onConfirm?.();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((n) => (
          <Chip
            active={n === nights}
            key={n}
            onClick={() => onNightsChange(n)}
            size="md"
            variant="outline"
          >
            <span className="font-semibold">{n + 1} días</span>
            <span className="opacity-80">/ {n} noches</span>
          </Chip>
        ))}
      </div>

      <div className="p-4 border border-gray-300 rounded-lg mt-4 bg-white text-center">
        <DayPicker
          classNames={{
            chevron: 'fill-primary',
            day: 'text-gray-500',
            selected: 'bg-primary border-primary text-white rounded-full',
            today: 'border-primary',
            range_start:
              'bg-primary border-primary text-white rounded-full rounded-r-none',
            range_end:
              'bg-primary border-primary text-white rounded-full rounded-l-none',
            range_middle: 'bg-primary border-primary rounded-none text-white',
          }}
          disabled={{
            before: new Date(new Date().setDate(new Date().getDate() + 7)),
          }}
          locale={es}
          max={maxNights + 1}
          min={2}
          mode="range"
          numberOfMonths={2}
          onSelect={handleRangeSelect}
          selected={selectedRange}
        />
        <p className="text-sm text-gray-500 mt-2">
          Fechas disponibles a partir de 7 días.
        </p>
      </div>
      <div className="flex items-center justify-center gap-10 mt-8 pt-6 border-t border-gray-200">
        <button
          className="text-gray-900 underline hover:no-underline text-sm font-medium"
          onClick={handleClearAll}
          type="button"
        >
          Borrar todo
        </button>

        {canContinue && (
          <Button
            className="text-sm font-normal normal-case"
            onClick={handleContinue}
            size="md"
            type="button"
            variant="default"
          >
            Confirmar fechas
          </Button>
        )}
      </div>
    </div>
  );
}
