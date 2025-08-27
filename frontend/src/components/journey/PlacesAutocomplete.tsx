'use client';
import { useJourneyStore } from '@/store/journeyStore';

export function CountryInput() {
  const { logistics, setPartial } = useJourneyStore();
  const value = logistics.country?.name ?? '';

  return (
    <input
      value={value}
      onChange={(e) =>
        setPartial({
          logistics: {
            ...logistics,
            country: { name: e.target.value || '', code: undefined },
          },
        })
      }
      className="input input-bordered w-full"
      placeholder="País de salida"
      aria-label="País de salida"
      autoComplete="off"
    />
  );
}

export function CityInput() {
  const { logistics, setPartial } = useJourneyStore();
  const value = logistics.city?.name ?? '';

  return (
    <input
      value={value}
      onChange={(e) =>
        setPartial({
          logistics: {
            ...logistics,
            city: { name: e.target.value || '', placeId: undefined },
          },
        })
      }
      className="input input-bordered w-full"
      placeholder="Ciudad de salida"
      aria-label="Ciudad de salida"
      autoComplete="off"
    />
  );
}