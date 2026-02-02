'use client';

import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { es } from 'react-day-picker/locale';
import Chip from '@/components/Chip';

function formatDateParam(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateParam(value: string | undefined) {
  if (!value) return undefined;
  // value is yyyy-mm-dd
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

interface JourneyDatesPickerProps {
  maxNights: number;
  nights: number;
  onNightsChange: (nights: number) => void;
  onStartDateChange: (startDate: string | undefined) => void;
  startDate: string | undefined; // yyyy-mm-dd
}

export function JourneyDatesPicker({
  maxNights,
  nights,
  onNightsChange,
  onStartDateChange,
  startDate,
}: JourneyDatesPickerProps) {
  const selectedDay = useMemo(() => parseDateParam(startDate), [startDate]);
  const options = useMemo(
    () => Array.from({ length: Math.max(1, maxNights) }, (_, i) => i + 1),
    [maxNights],
  );

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    onStartDateChange(formatDateParam(day));
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
          }}
          disabled={{
            before: new Date(new Date().setDate(new Date().getDate() + 7)),
          }}
          locale={es}
          mode="single"
          numberOfMonths={2}
          onSelect={handleDaySelect}
          required
          selected={selectedDay}
        />
        <p className="text-sm text-gray-500 mt-2">
          Fechas disponibles a partir de 7 días.
        </p>
      </div>
    </div>
  );
}

