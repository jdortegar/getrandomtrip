'use client';
import { useEffect, useRef, useState } from 'react';
import { useJourneyStore } from '@/store/journeyStore';

export default function AvoidSearchModal({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const { filters, setPartial } = useJourneyStore();
  const [query, setQuery] = useState('');
  const [local, setLocal] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // abrir con foco
  useEffect(() => {
    if (open) {
      setQuery('');
      setLocal([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const current = filters.avoidDestinations || [];
  const max = 15;

  const add = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    const exists = [...current, ...local].some(n => n.toLowerCase() === name.toLowerCase());
    if (exists) { setQuery(''); return; }
    if (current.length + local.length >= max) return;
    setLocal(arr => [...arr, name]);
    setQuery('');
  };

  const removeLocal = (name: string) => {
    setLocal(arr => arr.filter(n => n.toLowerCase() !== name.toLowerCase()));
  };

  const save = () => {
    // merge + dedupe
    const merged = [...current, ...local].filter(Boolean)
      .filter((v, i, a) => a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i)
      .slice(0, max);
    setPartial({ filters: { ...filters, avoidDestinations: merged } });
    onClose();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
            onKeyDown={onKey}
            placeholder="Ej.: Berlín, Ischia, Bali…"
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={()=>add(query)}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
            disabled={!query.trim() || (current.length + local.length) >= max}
          >
            Agregar
          </button>
        </div>

        {(local.length > 0 || current.length > 0) && (
          <div className="mt-4">
            <div className="text-sm text-neutral-600 mb-2">
              Seleccionados: {current.length + local.length} / {max}
            </div>
            <div className="flex flex-wrap gap-2">
              {current.map(n => (
                <span key={'c-'+n} className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {n}
                </span>
              ))}
              {local.map(n => (
                <button
                  key={'l-'+n}
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
          <button onClick={save} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white">
            Guardar destinos
          </button>
        </div>
      </div>
    &lt;/div&gt;
  );
}