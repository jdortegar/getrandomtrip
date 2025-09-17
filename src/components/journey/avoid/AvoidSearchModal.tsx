'use client';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/store';
import { useQuerySync } from '@/hooks/useQuerySync';

type Props = { open: boolean; onClose: () => void };

export default function AvoidSearchModal({ open, onClose }: Props) {
  const { filters, setPartial } = useStore();
  const sync = useQuerySync();
  const [query, setQuery] = useState('');
  const [local, setLocal] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco al abrir
  useEffect(() => {
    if (open) {
      setQuery('');
      setLocal([]);
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  if (!open) return null;

  const current = filters.avoidDestinations || [];
  const max = 15;

  const add = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    const pool = [...current, ...local];
    const exists = pool.some(n => n.toLowerCase() === name.toLowerCase());
    if (exists) { setQuery(''); return; }
    if (pool.length >= max) return;
    setLocal(prev => [...prev, name]);
    setQuery('');
  };

  const removeLocal = (name: string) => {
    setLocal(prev => prev.filter(n => n.toLowerCase() !== name.toLowerCase()));
  };

  const save = () => {
    const merged = [...current, ...local]
      .filter(Boolean)
      .filter((v, i, a) => a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i)
      .slice(0, max);
    setPartial({ filters: { ...filters, avoidDestinations: merged } });
    sync({ avoidDestinations: merged });
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') add(query);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg ring-1 ring-neutral-200">
        <h4 className="text-lg font-semibold mb-3">Agregar destinos a evitar</h4>
        <p className="text-sm text-neutral-600 mb-3">
          Escribí un destino por vez y presioná <span className="font-medium">Enter</span> o el botón “Agregar”.
          Podés cargar hasta {max} destinos en total.
        </p>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ej.: Berlín, Ischia, Bali…"
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={()=>add(query)}
            disabled={!query.trim() || (current.length + local.length) >= max}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white disabled:opacity-50"
          >
            Agregar
          </button>
        </div>

        {(current.length > 0 || local.length > 0) && (
          <div className="mt-4">
            <div className="text-sm text-neutral-600 mb-2">
              Seleccionados: {current.length + local.length} / {max}
            </div>
            <div className="flex flex-wrap gap-2">
              {current.map(n => (
                <span key={`cur-${n}`} className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {n}
                </span>
              ))}
              {local.map(n => (
                <button
                  key={`loc-${n}`}
                  onClick={()=>removeLocal(n)}
                  className="px-3 py-1 rounded-full bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100"
                >
                  {n} ×
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-neutral-300 bg-white">Cancelar</button>
          <button onClick={save} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white">Guardar destinos</button>
        </div>
      </div>
    </div>
  );
}
