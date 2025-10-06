'use client';
import { useStore } from '@/store/store';
import { FILTER_OPTIONS, Filters } from '@/store/slices/journeyStore';
import { AMERICAN_COUNTRIES } from '@/lib/data/countries';
import Chip from '@/components/badge';

type Item = {
  key: string;
  label: string;
  value: string | string[];
  locked?: boolean;
  onRemove?: () => void;
};

export default function SelectedFiltersChips() {
  const { filters, setPartial } = useStore();

  const items: Item[] = [];

  // Handle regular filters
  Object.keys(filters).forEach((key) => {
    if (key === 'avoidDestinations') return; // Handle separately

    const value = filters[key as keyof Filters];
    const filterConfig = FILTER_OPTIONS[key as keyof typeof FILTER_OPTIONS];
    const valueLabel =
      filterConfig?.options?.find((opt: any) => opt.key === value)?.label ||
      value;

    if (value !== 'indistinto' && value !== 'sin-limite') {
      items.push({
        key,
        value: valueLabel,
        label: filterConfig?.label,
        locked: key === 'transport',
        onRemove: () =>
          setPartial({ filters: { ...filters, [key]: 'indistinto' } }),
      });
    }
  });

  // Handle avoid destinations using countries data
  if (filters.avoidDestinations && filters.avoidDestinations.length > 0) {
    filters.avoidDestinations.forEach((destination) => {
      // Find the country or city in our countries data
      const country = AMERICAN_COUNTRIES.find(
        (c) =>
          c.name.toLowerCase() === destination.toLowerCase() ||
          c.cities.some(
            (city) => city.toLowerCase() === destination.toLowerCase(),
          ),
      );

      items.push({
        key: `avoid-${destination.toLowerCase()}`,
        value: destination,
        label: 'Evitar',
        onRemove: () =>
          setPartial({
            filters: {
              ...filters,
              avoidDestinations: filters.avoidDestinations.filter(
                (d) => d.toLowerCase() !== destination.toLowerCase(),
              ),
            },
          }),
      });
    });
  }

  return (
    <div className="max-w-[200px] mx-auto">
      <div className="mb-2 flex items-center justify-center w-full mx-auto">
        <span className="text-xs text-neutral-600 font-medium">
          Filtros Premium ({items.length - 1})
        </span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center py-2">
        {items.map((it) => (
          <Chip key={it.key} item={it} />
        ))}
      </div>
    </div>
  );
}
