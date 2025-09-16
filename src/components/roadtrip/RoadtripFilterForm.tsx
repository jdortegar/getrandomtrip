// frontend/src/components/roadtrip/RoadtripFilterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/components/common/analytics';

type Step = 1 | 2 | 3;

export default function RoadtripFilterForm() {
  const router = useRouter();

  // TAB actual
  const [step, setStep] = useState<Step>(1);

  // TAB 1 — info básica
  const [origin, setOrigin] = useState('');
  const [days, setDays] = useState<number>(7);
  const [kmPerDay, setKmPerDay] = useState<number>(200);

  // TAB 2 — tipo de roadtrip
  const types = [
    { id: 'nature', title: 'Paisajes & Naturaleza', desc: 'Montañas, lagos, cielos abiertos.' },
    { id: 'culture', title: 'Cultura Urbana & Street', desc: 'Ritmo, arte, barrios y escenas vivas.' },
    { id: 'wildlife', title: 'Wildlife & Fauna', desc: 'Encuentros con fauna en su hábitat.' },
    { id: 'drone', title: 'Drone & Panorámicas', desc: 'Perspectivas aéreas y horizontes amplios.' },
  ];
  const [selectedType, setSelectedType] = useState<string>('nature');

  // TAB 3 — afinar detalles (placeholder simples para demo)
  const [pace, setPace] = useState<'relax' | 'balanced' | 'intense'>('balanced');
  const [budgetLevel, setBudgetLevel] = useState<'smart' | 'comfort' | 'premium'>('comfort');

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  const prev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const goToAddOns = () => {
    const params = new URLSearchParams({
      pkg: 'custom-roadtrip',        // paquete “contenedor” para add-ons
      from: 'roadtrip-build',
      origin,
      days: String(days),
      kmPerDay: String(kmPerDay),
      type: selectedType,
      pace,
      budget: budgetLevel,
    }).toString();

    track('roadtrip_filters_complete', {
      origin,
      days,
      kmPerDay,
      type: selectedType,
      pace,
      budget: budgetLevel,
    });

    router.push(`/packages/add-ons?${params}`);
  };

  return (
    <section className="container mx-auto px-4 pt-24 md:pt-28 pb-12">
      {/* Tabs header */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { k: 1, label: 'Info Básica' },
          { k: 2, label: 'Tipo de Roadtrip' },
          { k: 3, label: 'Afinar detalles' },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setStep(t.k as Step)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              step === t.k
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Punto de Partida y Ritmo</h2>
            <p className="text-gray-600">Contanos desde dónde arrancás y cómo te gusta viajar.</p>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">¿Desde dónde salen?</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ej: Buenos Aires, Argentina"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">¿Cuántos días en total?</label>
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value || 0))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">¿Cuántos Km/día aprox.?</label>
                <input
                  type="number"
                  min={50}
                  value={kmPerDay}
                  onChange={(e) => setKmPerDay(Number(e.target.value || 0))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={next}
                className="rounded-full bg-black px-5 py-2 font-semibold text-white hover:bg-black/90"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Narradores Visuales</h2>
            <p className="text-gray-600">Elegí el tipo de roadtrip que mejor les va.</p>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    selectedType === t.id
                      ? 'border-black ring-1 ring-black'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-base font-semibold">{t.title}</div>
                  <div className="mt-2 text-sm text-gray-600">{t.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={prev}
                className="text-sm text-gray-600 underline-offset-2 hover:underline"
              >
                ← Volver
              </button>
              <button
                onClick={next}
                className="rounded-full bg-black px-5 py-2 font-semibold text-white hover:bg-black/90"
              >
                Capturá el siguiente cuadro →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Afinar detalles</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Ritmo</label>
                <div className="flex gap-2">
                  {(['relax', 'balanced', 'intense'] as const).map((p) => (
                    <label
                      key={p}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                        pace === p ? 'border-black ring-1 ring-black' : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pace"
                        className="sr-only"
                        checked={pace === p}
                        onChange={() => setPace(p)}
                      />
                      {p === 'relax' ? 'Relax' : p === 'balanced' ? 'Balanceado' : 'Intenso'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nivel de presupuesto</label>
                <div className="flex gap-2">
                  {(['smart', 'comfort', 'premium'] as const).map((b) => (
                    <label
                      key={b}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                        budgetLevel === b ? 'border-black ring-1 ring-black' : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="budget"
                        className="sr-only"
                        checked={budgetLevel === b}
                        onChange={() => setBudgetLevel(b)}
                      />
                      {b === 'smart' ? 'Smart' : b === 'comfort' ? 'Comfort' : 'Premium'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={prev}
                className="text-sm text-gray-600 underline-offset-2 hover:underline"
              >
                ← Volver
              </button>

              <button
                onClick={goToAddOns}
                className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 font-bold text-gray-900 hover:bg-[#EACD65] transition-colors"
              >
                Continuar a Add-ons →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
