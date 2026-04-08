'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useQuerySync } from '@/hooks/useQuerySync';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/badge';
import CitySearchSelector from './CitySearchSelector';
import type { AvoidCity } from '@/lib/helpers/avoid-cities';
import {
  avoidCityLabelsEqual,
  canonicalAvoidCityLabel,
} from '@/lib/helpers/avoid-destinations';

export interface AvoidSearchModalLabels {
  addButton: string;
  cancelButton: string;
  saveDestinationsButton: string;
  selectedCountTemplate: string;
  selectedDestinationsHeading: string;
  title: string;
}

interface AvoidSearchModalProps {
  labels: AvoidSearchModalLabels;
  onClose: () => void;
  open: boolean;
}

export default function AvoidSearchModal({
  labels,
  onClose,
  open,
}: AvoidSearchModalProps) {
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [local, setLocal] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = useMemo(() => {
    const raw = searchParams.get('avoidDestinations');
    return raw
      ? raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }, [searchParams]);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setQuery('');
      setLocal([]);
    }
  }, [open]);

  if (!open) return null;

  const max = 15;
  const totalCount = current.length + local.length;
  const selectedCountText = labels.selectedCountTemplate
    .replace('{count}', String(totalCount))
    .replace('{max}', String(max));

  const add = (rawLabel: string) => {
    const label = canonicalAvoidCityLabel(rawLabel);
    if (!label) return;
    const pool = [...current, ...local];
    const exists = pool.some((n) => avoidCityLabelsEqual(n, label));
    if (exists) {
      setQuery('');
      return;
    }
    if (pool.length >= max) return;
    setLocal((prev) => [...prev, label]);
    setQuery('');
  };

  const handleCitySelect = (city: AvoidCity) => {
    add(city.name);
  };

  const removeLocal = (name: string) => {
    setLocal((prev) =>
      prev.filter((n) => !avoidCityLabelsEqual(n, name)),
    );
  };

  const save = () => {
    const merged = [...current, ...local]
      .map(canonicalAvoidCityLabel)
      .filter(Boolean)
      .filter(
        (v, i, a) =>
          a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i,
      )
      .slice(0, max);
    updateQuery({
      avoidDestinations: merged.length > 0 ? merged : undefined,
    });
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add(query);
    }
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        aria-labelledby="avoid-modal-title"
        aria-modal="true"
        className="relative w-full max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-md"
        role="dialog"
      >
        <h2
          className="text-base font-bold text-gray-900"
          id="avoid-modal-title"
        >
          {labels.title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{selectedCountText}</p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <CitySearchSelector
            className="min-w-0 flex-1"
            onChange={setQuery}
            onKeyDown={onKeyDown}
            onSelect={handleCitySelect}
            value={query}
          />
          <Button
            className="h-9 rounded-md text-sm font-normal normal-case"
            disabled={!query.trim() || totalCount >= max}
            onClick={() => add(query)}
            size="sm"
            type="button"
            variant="default"
          >
            {labels.addButton}
          </Button>
        </div>

        {(current.length > 0 || local.length > 0) && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-gray-900">
              {labels.selectedDestinationsHeading}
            </p>
            <div className="flex flex-wrap gap-2">
              {current.map((n) => (
                <Badge
                  color="secondary"
                  item={{
                    key: `cur-${n}`,
                    value: n,
                  }}
                  key={`cur-${n}`}
                />
              ))}
              {local.map((n) => (
                <Badge
                  color="primary"
                  item={{
                    key: `loc-${n}`,
                    onRemove: () => removeLocal(n),
                    value: n,
                  }}
                  key={`loc-${n}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-10 border-t border-gray-200 pt-6">
          <button
            className="text-sm font-medium text-gray-900 underline hover:no-underline"
            onClick={onClose}
            type="button"
          >
            {labels.cancelButton}
          </button>
          <Button
            className="text-sm font-normal normal-case"
            onClick={save}
            size="md"
            type="button"
            variant="default"
          >
            {labels.saveDestinationsButton}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
