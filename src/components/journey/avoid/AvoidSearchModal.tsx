'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import { useQuerySync } from '@/hooks/useQuerySync';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/badge';
import CitySearchSelector from './CitySearchSelector';
import type { AvoidCity } from '@/lib/helpers/avoid-cities';

type Props = { open: boolean; onClose: () => void };

export default function AvoidSearchModal({ open, onClose }: Props) {
  const { filters, setPartial } = useStore();
  const sync = useQuerySync();
  const [query, setQuery] = useState('');
  const [local, setLocal] = useState<string[]>([]);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setQuery('');
      setLocal([]);
    }
  }, [open]);

  if (!open) return null;

  const current = filters.avoidDestinations || [];
  const max = 15;

  /** Normalize to city name only so URL param (comma-separated list) does not break. */
  const toCityOnly = (value: string) =>
    value.trim().split(',')[0].trim() || value.trim();

  const add = (input: string) => {
    const name = toCityOnly(input);
    if (!name) return;
    const pool = [...current, ...local];
    const exists = pool.some((n) => n.toLowerCase() === name.toLowerCase());
    if (exists) {
      setQuery('');
      return;
    }
    if (pool.length >= max) return;
    setLocal((prev) => [...prev, name]);
    setQuery('');
  };

  const handleCitySelect = (city: AvoidCity) => {
    add(city.name);
  };

  const removeLocal = (name: string) => {
    setLocal((prev) =>
      prev.filter((n) => n.toLowerCase() !== name.toLowerCase()),
    );
  };

  const save = () => {
    const merged = [...current, ...local]
      .map(toCityOnly)
      .filter(Boolean)
      .filter(
        (v, i, a) =>
          a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i,
      )
      .slice(0, max);
    setPartial({ filters: { ...filters, avoidDestinations: merged } });
    sync({ avoidDestinations: merged });
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add(query);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-md"
        role="dialog"
        aria-labelledby="avoid-modal-title"
        aria-modal="true"
      >
        <h2
          className="text-base font-bold text-gray-900"
          id="avoid-modal-title"
        >
          Agregar destinos a evitar
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Seleccionados: {current.length + local.length} / {max}
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <CitySearchSelector
            className="min-w-0 flex-1"
            onKeyDown={onKeyDown}
            onChange={setQuery}
            onSelect={handleCitySelect}
            value={query}
          />
          <Button
            className="h-9 text-sm font-normal normal-case rounded-md"
            disabled={!query.trim() || current.length + local.length >= max}
            onClick={() => add(query)}
            size="sm"
            type="button"
            variant="default"
          >
            Agregar
          </Button>
        </div>

        {(current.length > 0 || local.length > 0) && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-gray-900">
              Destinos seleccionados
            </p>
            <div className="flex flex-wrap gap-2">
              {current.map((n) => (
                <Badge
                  key={`cur-${n}`}
                  color="secondary"
                  item={{
                    key: `cur-${n}`,
                    label: 'Ciudad',
                    value: n,
                  }}
                />
              ))}
              {local.map((n) => (
                <Badge
                  key={`loc-${n}`}
                  color="primary"
                  item={{
                    key: `loc-${n}`,
                    label: 'Ciudad',
                    onRemove: () => removeLocal(n),
                    value: n,
                  }}
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
            Cancelar
          </button>
          <Button
            className="text-sm font-normal normal-case"
            onClick={save}
            size="md"
            type="button"
            variant="default"
          >
            Guardar destinos
          </Button>
        </div>
      </div>
    </div>
  );
}
