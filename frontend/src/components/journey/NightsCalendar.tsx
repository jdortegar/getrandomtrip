
'use client';
import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useJourneyStore } from '@/store/journeyStore';
import { getMaxNights } from '@/lib/levels';
import { addDays, fmtISO, toDateOnly } from '@/lib/date';
import { LevelSlug } from '@/store/journeyStore';

function Chip({
  active, onClick, children,
}: { active:boolean; onClick:()=>void; children:React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition
        ${active
          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
          : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
        }`}
    >
      {children}
    </button>
  );
}

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

  const max = getMaxNights(level) === 'custom' ? 14 : (getMaxNights(level) as number);
  const options = Array.from({length: max}, (_,i)=> i+1); // noches: 1..max

  useEffect(() => {
    if (startDate) {
      setSelectedDay(toDateOnly(new Date(startDate)));
    }
  }, [startDate]);

  const handleNightChange = (numNights: number) => {
    if (max !== 'custom' && numNights > max) {
      setError(`Con ${levelNames[level]} se permiten hasta ${max} noches.`);
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
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map(n => (
          <Chip key={n} active={n===nights} onClick={()=>handleNightChange(n)}>
            <span className="font-semibold">{n+1} días</span>
            <span className="opacity-80">/ {n} noches</span>
          </Chip>
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
