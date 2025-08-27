
'use client';
import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useJourneyStore } from '@/store/journeyStore';
import { getMaxNights } from '@/lib/levels';
import { addDays, fmtISO, toDateOnly } from '@/lib/date';
import { LevelSlug } from '@/store/journeyStore';

const levelNames: Record<LevelSlug, string> = {
  'essenza': 'Essenza',
  'modo-explora': 'Modo Explora',
  'explora-plus': 'Explora+',
  'bivouac': 'Bivouac',
  'atelier-getaway': 'Atelier Getaway',
};

export default function NightsCalendar() {
  const { level, logistics, setPartial } = useJourneyStore();
  const { startDate, nights } = logistics;

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(startDate ? toDateOnly(new Date(startDate)) : undefined);
  const [error, setError] = useState<string | null>(null);

  const maxNights = getMaxNights(level);
  const nightOptions = Array.from({ length: maxNights === 'custom' ? 14 : maxNights }, (_, i) => i + 1);

  useEffect(() => {
    if (startDate) {
      setSelectedDay(toDateOnly(new Date(startDate)));
    }
  }, [startDate]);

  const handleNightChange = (numNights: number) => {
    if (maxNights !== 'custom' && numNights > maxNights) {
      setError(`Con ${levelNames[level]} se permiten hasta ${maxNights} noches.`);
      return;
    }
    setError(null);
    const newEndDate = selectedDay ? fmtISO(addDays(selectedDay, numNights)) : undefined;
    setPartial({ logistics: { ...logistics, nights: numNights, endDate: newEndDate } });
  };

  const handleDayClick = (day: Date) => {
    const today = toDateOnly(new Date());
    if (day < today) return;

    setSelectedDay(day);
    const newStartDate = fmtISO(day);
    const newEndDate = fmtISO(addDays(day, nights));
    setPartial({ logistics: { ...logistics, startDate: newStartDate, endDate: newEndDate } });
  };

  const Chip = ({ label, value, active }: { label: string, value: number, active: boolean }) => (
    <button
      onClick={() => handleNightChange(value)}
      className={`px-4 py-2 rounded-full text-sm font-medium border ${active ? 'bg-terracotta-600 text-white border-terracotta-600' : 'bg-white text-neutral-700 border-neutral-300'}`}
    >
      {label}
    </button>
  );

  const modifiers = {
    selected: selectedDay,
    range: selectedDay ? { from: selectedDay, to: addDays(selectedDay, nights) } : undefined,
  };

  const modifiersStyles = {
    selected: { backgroundColor: '#D97706', color: 'white' },
    range: { backgroundColor: '#FEF3C7' },
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold">Duración de la aventura</h3>
      <div className="flex flex-wrap gap-2 my-4">
        {nightOptions.map(n => (
          <Chip key={n} label={`${n + 1} días / ${n} noches`} value={n} active={n === nights} />
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="p-4 border rounded-lg mt-4">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={handleDayClick}
          numberOfMonths={2}
          disabled={{ before: toDateOnly(new Date()) }}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          footer={<p className="text-sm text-neutral-500 mt-2">Seleccioná la fecha de salida. Las noches se calculan con el selector superior.</p>}
        />
      </div>
    </div>
  );
}
