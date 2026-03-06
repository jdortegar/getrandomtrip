'use client';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/store';
import { useQuerySync } from '@/hooks/useQuerySync';
import { FILTER_OPTIONS, Filters } from '@/store/slices/journeyStore';
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
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();

  const avoidDestinations = useMemo(() => {
    const raw = searchParams.get('avoidDestinations');
    return raw
      ? raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }, [searchParams]);

  const items: Item[] = [];

  // Handle regular filters (avoidDestinations lives in URL only)
  Object.keys(filters).forEach((key) => {
    const value = filters[key as keyof Filters];
    const filterConfig = FILTER_OPTIONS[key as keyof typeof FILTER_OPTIONS];
    if (!filterConfig) return;
    const valueLabel =
      filterConfig?.options?.find((opt: any) => opt.key === value)?.label ||
      value;

    if (value !== 'indistinto' && value !== 'sin-limite') {
      items.push({
        key,
        value: valueLabel,
        label: filterConfig?.label ?? key,
        locked: key === 'transport',
        onRemove: () =>
          setPartial({ filters: { ...filters, [key]: 'indistinto' } }),
      });
    }
  });

  // Handle avoid destinations from URL
  avoidDestinations.forEach((destination) => {
    items.push({
      key: `avoid-${destination.toLowerCase()}`,
      value: destination,
      label: 'Evitar',
      onRemove: () => {
        const next = avoidDestinations.filter(
          (d) => d.toLowerCase() !== destination.toLowerCase(),
        );
        updateQuery({
          avoidDestinations: next.length > 0 ? next : undefined,
        });
      },
    });
  });

  return (
    <div className="max-w-[200px] mx-auto">
      <div className="mb-2 flex items-center justify-center w-full mx-auto">
        <span className="text-xs text-neutral-600 font-medium">
          Filtros Premium ({items.length - 1})
        </span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center py-2">
        {items.map((it) => (
          <Chip key={it.key} item={it} color="primary" />
        ))}
      </div>
    </div>
  );
}
