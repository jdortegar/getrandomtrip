'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Pace = 'relajado' | 'balanceado' | 'intenso';

type FiltersPayload = {
  pace: Pace;
  nights?: number;
  datesFlex: 'exactas' | '+/- 3 días' | '+/- 7 días';
  transport: string[];     // ['avión','tren','bus']
  vibe: string[];          // ['boutique','diseño','local','lujo']
  interests: string[];     // ['foodie','arte','outdoors','nightlife','wellness']
  accessibility?: string[];// ['pet-friendly','step-free','quiet']
};

export default function FiltersPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const bookingId = sp.get('bookingId') ?? '';
  const origin = sp.get('origin') ?? '';
  const tier = sp.get('tier') ?? '';
  const price = sp.get('price') ?? '';

  const [pace, setPace] = useState<Pace>('balanceado');
  const [datesFlex, setDatesFlex] = useState<'exactas' | '+/- 3 días' | '+/- 7 días'>('+/- 3 días');
  const [nights, setNights] = useState<number | undefined>(undefined);
  const [transport, setTransport] = useState<string[]>([]);
  const [vibe, setVibe] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierLabel = useMemo(() => {
    if (!tier) return null;
    const map: Record<string, string> = {
      essenza: 'Essenza',
      'modo-explora': 'Modo Explora',
      explora: 'Explora+',
      'explora+': 'Explora+',
      bivouac: 'Bivouac',
      atelier: 'Atelier Getaway',
    };
    return map[tier.toLowerCase()] ?? tier;
  }, [tier]);

  const toggle = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

  if (!bookingId) {
    return (
      <main className="min-h-screen bg-white text-neutral-900 flex items-center justify-center p-8">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl font-bold mb-2">Falta el bookingId</h1>
          <p className="text-neutral-600">Vuelve atrás y reintenta desde la landing.</p>
        </div>
      </main>
    );
  }

  const onSave = async () => {
    setSaving(true);
    setError(null);
    const payload: { filters: FiltersPayload } = {
      filters: {
        pace,
        nights,
        datesFlex,
        transport,
        vibe,
        interests,
        accessibility: accessibility.length ? accessibility : undefined,
      },
    };
    try {
      const res = await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('PATCH /bookings fallo');
      router.push(`/journey/basic-config?bookingId=${bookingId}`);
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const Box: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="bg-white border border-neutral-200 rounded-2xl p-5">
      <h3 className="font-display text-lg font-bold tracking-tightish mb-3">{title}</h3>
      {children}
    </section>
  );

  const Chip: React.FC<{ on: boolean; label: string; onClick: () => void }> = ({ on, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-sm transition
        ${on ? 'bg-[var(--rt-terracotta)] text-white border-[var(--rt-terracotta)]' : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50'}`}
    >
      {label}
    </button>
  );

  return (
    <main className="bg-neutral-50 text-neutral-900 min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <header className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tightish">Afiná tu Randomtrip</h1>
          <p className="text-neutral-600 mt-3">Estos filtros nos ayudan a curar mejor tu experiencia.</p>

          {(tierLabel || origin || price) && (
            <div className="mt-5 inline-flex flex-wrap items-center gap-3 bg-white border border-neutral-200 rounded-full px-4 py-2">
              {tierLabel && <span className="text-sm">Nivel: <strong>{tierLabel}</strong></span>}
              {price && <span className="text-sm">Base: <strong>USD {price}</strong></span>}
              {origin && <span className="text-sm text-neutral-500">Origen: {origin}</span>}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Box title="Ritmo">
            <div className="flex gap-2">
              {(['relajado','balanceado','intenso'] as Pace[]).map(p => (
                <Chip key={p} on={pace===p} label={p} onClick={() => setPace(p)} />
              ))}
            </div>
          </Box>

          <Box title="Duración (noches)">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={14}
                value={nights ?? ''}
                onChange={(e) => setNights(e.target.value ? Number(e.target.value) : undefined)}
                className="w-28 rounded-lg border border-neutral-300 px-3 py-2"
                placeholder="Ej. 3"
              />
              <span className="text-sm text-neutral-500">opcional (si no, usamos el rango del nivel)</span>
            </div>
          </Box>

          <Box title="Flexibilidad de fechas">
            <div className="flex gap-2 flex-wrap">
              {['exactas',' +/- 3 días',' +/- 7 días'].map(opt => (
                <Chip key={opt} on={datesFlex===opt} label={opt} onClick={() => setDatesFlex(opt as any)} />
              ))}
            </div>
          </Box>

          <Box title="Transporte preferido">
            <div className="flex gap-2 flex-wrap">
              {['avión','tren','bus'].map(t => (
                <Chip key={t} on={transport.includes(t)} label={t} onClick={() => setTransport(toggle(transport, t))} />
              ))}
            </div>
          </Box>

          <Box title="Vibe del alojamiento">
            <div className="flex gap-2 flex-wrap">
              {['boutique','diseño','local','lujo'].map(v => (
                <Chip key={v} on={vibe.includes(v)} label={v} onClick={() => setVibe(toggle(vibe, v))} />
              ))}
            </div>
          </Box>

          <Box title="Intereses">
            <div className="flex gap-2 flex-wrap">
              {['foodie','arte','outdoors','nightlife','wellness'].map(i => (
                <Chip key={i} on={interests.includes(i)} label={i} onClick={() => setInterests(toggle(interests, i))} />
              ))}
            </div>
          </Box>

          <Box title="Accesibilidad / Preferencias">
            <div className="flex gap-2 flex-wrap">
              {['pet-friendly','step-free','quiet'].map(a => (
                <Chip key={a} on={accessibility.includes(a)} label={a} onClick={() => setAccessibility(toggle(accessibility, a))} />
              ))}
            </div>
          </Box>
        </div>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            onClick={onSave}
            disabled={saving}
            className="btn-card disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar y continuar'}
          </button>

          <button
            onClick={() => router.push(`/journey/basic-config?bookingId=${bookingId}`)}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Saltar por ahora
          </button>
        </div>
      </div>
    </main>
  );
}
