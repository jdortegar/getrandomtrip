'use client';
import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { getMaxNights, getLevelName, Level } from '@/lib/data/levels';
import { es } from 'react-day-picker/locale';
import Chip from '@/components/Chip';
import { useStore } from '@/store/store';

interface NightsCalendarProps {
  level: Level;
}

export default function NightsCalendar({ level }: NightsCalendarProps) {
  const { logistics, setPartial } = useStore();

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(
    logistics.startDate ? new Date(logistics.startDate) : undefined,
  );
  const [selectedNights, setSelectedNights] = useState<number>(
    logistics.nights || 1,
  );
  const [error, setError] = useState<string | null>(null);

  // Get max nights for the level
  const maxNights = level.maxNights;
  const options = Array.from({ length: maxNights }, (_, i) => i + 1);

  // Update local state when store changes
  useEffect(() => {
    if (logistics.startDate) {
      setSelectedDay(new Date(logistics.startDate));
    }
    if (logistics.nights) {
      setSelectedNights(logistics.nights);
    }
  }, [logistics.startDate, logistics.nights]);

  const handleNightChange = (numNights: number) => {
    setError(null);
    setSelectedNights(numNights);

    // Calculate end date if we have a selected day
    let endDate: Date | undefined;
    if (selectedDay) {
      endDate = new Date(selectedDay);
      endDate.setDate(endDate.getDate() + numNights);
    }

    // Update both nights and endDate in a single setPartial call
    setPartial({
      logistics: {
        ...logistics,
        nights: numNights,
        endDate: endDate,
      },
    });
  };

  const handleDayClick = (day: Date) => {
    const today = new Date();
    if (day < today) return;

    // Create a local date to avoid timezone issues
    setSelectedDay(day);

    // Calculate end date if we have selected nights
    let endDate: Date | undefined;
    if (selectedNights) {
      endDate = new Date(day);
      endDate.setDate(endDate.getDate() + selectedNights);
    }

    // Update both startDate and endDate in a single setPartial call
    setPartial({
      logistics: {
        ...logistics,
        startDate: day,
        endDate: endDate,
      },
    });
  };

  const modifiers = {
    selected: selectedDay,
    range:
      selectedDay && selectedNights
        ? {
            from: new Date(selectedDay),
            to: (() => {
              const endDate = new Date(selectedDay);
              endDate.setDate(endDate.getDate() + selectedNights);
              return endDate;
            })(),
          }
        : undefined,
  };

  const modifiersStyles = {
    range: {
      backgroundColor: '#111827',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '100%',
    },
  };

  return (
    <div>
      {/* <h3 className="font-semibold">Duración de la aventura</h3> */}
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map((n) => (
          <Chip
            key={n}
            active={n === selectedNights}
            onClick={() => handleNightChange(n)}
            variant="outline"
            size="md"
          >
            <span className="font-semibold">{n + 1} días</span>
            <span className="opacity-80">/ {n} noches</span>
          </Chip>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="p-4 border border-gray-300 rounded-lg mt-4 bg-white ring-0 focus-visible:ring-0 text-center">
        <DayPicker
          mode="single"
          required
          selected={selectedDay}
          onSelect={handleDayClick}
          numberOfMonths={2}
          disabled={{ before: new Date() }}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          locale={es}
          classNames={{
            today: `border-primary`,
            selected: `bg-primary border-primary text-white rounded-full`,
            day: 'text-gray-500',
            chevron: `fill-primary`,
          }}
        />
      </div>
    </div>
  );
}
