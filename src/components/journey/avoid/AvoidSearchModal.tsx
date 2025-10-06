'use client';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/store';
import { useQuerySync } from '@/hooks/useQuerySync';
import { Button } from '@/components/ui/button';
import Badge from '@/components/badge';
import CountrySelector from '../CountrySelector';

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

  const add = (raw: string) => {
    const name = raw.trim();
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

  const removeLocal = (name: string) => {
    setLocal((prev) =>
      prev.filter((n) => n.toLowerCase() !== name.toLowerCase()),
    );
  };

  const save = () => {
    const merged = [...current, ...local]
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-gray-100 p-4 rounded-md mx-auto mb-12 border border-gray-200 shadow-lg">
        <h4 className="text-lg font-semibold">Agregar destinos a evitar</h4>
        <p className="text-sm text-neutral-600 mb-3">
          Seleccionados: {current.length + local.length} / {max}
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <CountrySelector
            value={query}
            onChange={setQuery}
            onKeyDown={onKeyDown}
            className="flex-1"
          />
          <Button
            onClick={() => add(query)}
            disabled={!query.trim() || current.length + local.length >= max}
          >
            Agregar
          </Button>
        </div>

        {(current.length > 0 || local.length > 0) && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {current.map((n) => (
                <Badge
                  key={`cur-${n}`}
                  color="secondary"
                  item={{
                    key: `cur-${n}`,
                    value: n,
                    label: 'Pais',
                  }}
                />
              ))}
              {local.map((n) => (
                <Badge
                  key={`loc-${n}`}
                  color="primary"
                  item={{
                    key: `loc-${n}`,
                    value: n,
                    label: 'Pais',
                    onRemove: () => removeLocal(n),
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button onClick={save} variant="default">
            Guardar destinos
          </Button>
        </div>
      </div>
    </div>
  );
}
