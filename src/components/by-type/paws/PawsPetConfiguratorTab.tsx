// frontend/src/components/by-type/paws/PawsPetConfiguratorTab.tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Img from '@/components/common/Img'; // Added import

// =====================================
// Types
// =====================================
export type LevelId = 'essenza' | 'explora' | 'explora-plus' | 'exploraPlus' | 'bivouac' | 'atelier';
export type PetSize = 'small' | 'medium' | 'large';
export type Transport = 'cabina' | 'bodega' | 'auto';

// =====================================
// Pricing Config
// =====================================
const LEVEL_TOPS: Record<'essenza' | 'explora' | 'explora-plus' | 'bivouac' | 'atelier', number> = {
  essenza: 450,
  explora: 650,
  'explora-plus': 1100,
  bivouac: 1550,
  atelier: 1550,
};

const SIZE_FACTORS: Record<PetSize, number> = { small: 1.0, medium: 1.05, large: 1.1 };
const CARGO_FACTORS: Record<Transport, number> = { cabina: 1.0, bodega: 1.1, auto: 1.0 };
const PET_EXTRA_STEP = 0.25; // +25% por mascota adicional

function normalizeLevel(id: LevelId): 'essenza' | 'explora' | 'explora-plus' | 'bivouac' | 'atelier' {
  if (id === 'exploraPlus') return 'explora-plus';
  return (id as any);
}

// =====================================
// Pure function (tests use this)
// - Fuerza "bodega" si size === 'large' y transport === 'cabina'
// =====================================
export function computePetBudgetEstimate(
  levelId: LevelId,
  totalPets: number,
  size: PetSize,
  transport: Transport
): number {
  const norm = normalizeLevel(levelId);
  const baseTop = LEVEL_TOPS[norm] ?? 650;
  const extras = Math.max(0, Math.min(2, totalPets - 1));

  const effectiveTransport: Transport = size === 'large' && transport === 'cabina' ? 'bodega' : transport;

  let total = baseTop;
  total *= 1 + PET_EXTRA_STEP * extras;
  total *= SIZE_FACTORS[size];
  total *= CARGO_FACTORS[effectiveTransport];
  return Math.round(total);
}

const isPremium = (levelId: LevelId) => {
  const norm = normalizeLevel(levelId);
  return norm === 'explora-plus' || norm === 'bivouac' || norm === 'atelier';
};

// =====================================
// Component — Tab 2 (cinematic skin + better contrast)
// =====================================
interface Props {
  levelId: LevelId;
  onBackToLevels?: () => void;
  onNextToEscape?: () => void; // ← NUEVO
}

export default function PawsPetConfiguratorTab({ levelId, onBackToLevels, onNextToEscape }: Props) {
  // Core
  const [totalPets, setTotalPets] = useState<1 | 2 | 3>(1);
  const [size, setSize] = useState<PetSize>('small');
  const [transport, setTransport] = useState<Transport>('cabina');

  // Premium-only
  const premium = isPremium(levelId);
  const [airlinePref, setAirlinePref] = useState<string>('none');
  const [hotelPref, setHotelPref] = useState<string>('');
  const [walksPerDay, setWalksPerDay] = useState<'1-2' | '2-3' | '3+'>('1-2');
  const [kidFriendly, setKidFriendly] = useState<'yes' | 'no' | 'unsure'>('yes');
  const [dogFriendly, setDogFriendly] = useState<'yes' | 'no' | 'unsure'>('yes');

  // UI mirror of the force rule
  useEffect(() => {
    if (size === 'large' && transport === 'cabina') setTransport('bodega');
  }, [size, transport]);

  const estimate = useMemo(
    () => computePetBudgetEstimate(levelId, totalPets, size, transport),
    [levelId, totalPets, size, transport]
  );

  // URL (para CTA "Continuar" si se decide ir directo a basic-config)
  const query = new URLSearchParams({
    from: 'paws',
    level: String(levelId),
    totalPets: String(totalPets),
    size,
    transport: size === 'large' && transport === 'cabina' ? 'bodega' : transport,
    estimate: String(estimate),
  });
  if (premium) {
    if (airlinePref && airlinePref !== 'none') query.set('airline', airlinePref);
    if (hotelPref.trim()) query.set('hotel', hotelPref.trim());
    query.set('walksPerDay', walksPerDay);
    query.set('kidFriendly', kidFriendly);
    query.set('dogFriendly', dogFriendly);
  }
  const continueHref = `/journey/basic-config?${query.toString()}`;

  const norm = normalizeLevel(levelId);
  const labelMap: Record<typeof norm, string> = {
    essenza: 'Essenza',
    explora: 'Explora',
    'explora-plus': 'Explora+',
    bivouac: 'Bivouac',
    atelier: 'Atelier',
  };

  const isCabinaDisabled = size === 'large';

  return (
    <section className="relative overflow-hidden">
      {/* Cinematic background + DARKER overlay for contrast */}
      <div className="absolute inset-0 -z-10">
        <Img
          src="/images/bg/paws-cinematic.jpg"
          alt="Cinematic background"
          className="h-full w-full object-cover"
          width={1920} // Assuming a common cinematic background width
          height={1080} // Assuming a common cinematic background height
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-12">
        <motion.header
          className="text-center mb-6 md:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-[11px] text-white/90 bg-white/10 backdrop-blur">
            Más detalles
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow">
            Diseña tu viaje con tu mascota
          </h2>
          <p className="mt-2 text-white/90 max-w-lg mx-auto drop-shadow">
            Ajusta logística y confort para que todo fluya con tu compañer@ de cuatro patas.
          </p>
        </motion.header>

        <motion.div
          className="rounded-3xl border border-white/20 bg-white/95 backdrop-blur shadow-2xl p-5 md:p-7"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left form */}
            <div className="space-y-6">
              {/* Nivel */}
              <div>
                <div className="text-[11px] text-neutral-600 mb-1">Nivel</div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 bg-white text-sm font-medium text-neutral-900">
                  {labelMap[norm]}
                </div>
              </div>

              {/* Total mascotas */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">🐾 Total de Mascotas</h3>
                <p className="text-xs text-neutral-500 mb-2">Incluye la principal. Cada adicional suma +25%.</p>
                <div className="inline-flex rounded-2xl bg-neutral-100 p-1 gap-1" role="tablist" aria-label="Total de Mascotas">
                  {[1, 2, 3].map((n) => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={n}
                      type="button"
                      onClick={() => setTotalPets(n as 1 | 2 | 3)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium ${
                        totalPets === n ? 'bg-white shadow text-neutral-900' : 'text-neutral-700 hover:bg-white/60'
                      }`}
                      aria-pressed={totalPets === n}
                    >
                      {n}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Tamaño */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">📏 Tamaño Principal</h3>
                <p className="text-xs text-neutral-500 mb-2">Pequeño (≤12kg) · Mediano (≤23kg) · Grande (23kg+)</p>
                <div className="inline-flex rounded-2xl bg-neutral-100 p-1 gap-1" role="tablist" aria-label="Tamaño Principal">
                  {[
                    { label: 'Pequeño', value: 'small' as const },
                    { label: 'Mediano', value: 'medium' as const },
                    { label: 'Grande', value: 'large' as const },
                  ].map((opt) => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={opt.value}
                      onClick={() => setSize(opt.value)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium ${
                        size === opt.value ? 'bg-white shadow text-neutral-900' : 'text-neutral-700 hover:bg-white/60'
                      }`}
                      aria-pressed={size === opt.value}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Transporte */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">✈️ Transporte</h3>
                <p className="text-xs text-neutral-500 mb-2">Si es grande, normalmente viaja en bodega.</p>
                <div className="inline-flex rounded-2xl bg-neutral-100 p-1 gap-1" role="tablist" aria-label="Transporte">
                  {[
                    { label: 'Cabina', value: 'cabina' as const },
                    { label: 'Bodega', value: 'bodega' as const },
                    { label: 'Auto', value: 'auto' as const },
                  ].map((opt) => {
                    const disabled = isCabinaDisabled && opt.value === 'cabina';
                    return (
                      <motion.button
                        whileTap={{ scale: disabled ? 1 : 0.95 }}
                        key={opt.value}
                        disabled={disabled}
                        onClick={() => !disabled && setTransport(opt.value)}
                        className={`px-3 py-2 rounded-2xl text-sm font-medium ${
                          transport === opt.value ? 'bg-white shadow text-neutral-900' : 'text-neutral-700 hover:bg-white/60'
                        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={disabled ? 'Mascotas grandes no viajan en cabina' : undefined}
                        aria-pressed={transport === opt.value}
                        aria-disabled={disabled}
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* --- PREMIUM NOTE just under transport --- */}
              {premium && (
                <div className="pt-3 border-t border-neutral-200">
                  <p className="text-[12px] text-neutral-600">
                    <strong>
                      Opciones exclusivas por <span className="whitespace-nowrap">🌟 Destination Decoded</span>
                    </strong>{' '}
                    — disponibles desde Explora+ en adelante.
                  </p>
                </div>
              )}

              {/* Premium-only fields */}
              {premium && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">🏨 Preferencia de hotel</h3>
                    <input
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                      placeholder="Cadena / estilo (boutique, design, luxury, ... )"
                      value={hotelPref}
                      onChange={(e) => setHotelPref(e.target.value)}
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">🛫 Preferencia de aerolínea</h3>
                    <select
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                      value={airlinePref}
                      onChange={(e) => setAirlinePref(e.target.value)}
                    >
                      <option value="none">Sin preferencia</option>
                      <option value="Aeromexico">AeroMéxico</option>
                      <option value="LATAM">LATAM</option>
                      <option value="Volaris">Volaris</option>
                      <option value="Avianca">Avianca</option>
                      <option value="United">United</option>
                      <option value="American">American</option>
                      <option value="Delta">Delta</option>
                    </select>
                  </div>

                  {/* Mejor separación de bloques (no encimados) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">🚶‍♂️ Paseos/día</h3>
                      <div className="mt-2 inline-flex rounded-2xl bg-neutral-100 p-1 gap-1">
                        {(['1-2', '2-3', '3+'] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setWalksPerDay(opt)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium ${
                              walksPerDay === opt ? 'bg-white shadow text-neutral-900' : 'text-neutral-700 hover:bg-white/60'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">👶 Con niños</h3>
                      <div className="mt-2 inline-flex rounded-2xl bg-neutral-100 p-1 gap-1 flex-wrap">
                        {(['yes', 'no', 'unsure'] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setKidFriendly(opt)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium ${
                              kidFriendly === opt ? 'bg-white shadow text-neutral-900' : 'text-neutral-700 hover:bg-white/60'
                            }`}
                          >
                            {opt === 'yes' ? 'Sí' : opt === 'no' ? 'No' : 'Depende'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">🐕 Con otros perros</h3>
                      <div className="mt-2 inline-flex rounded-2xl bg-neutral-100 p-1 gap-1 flex-wrap">
                        {(['yes', 'no', 'unsure'] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setDogFriendly(opt)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium ${
                              dogFriendly === opt ? 'bg-white shadow text-neutral-900' : 'text-neutral-700 hover:bg-white/60'
                            }`}
                          >
                            {opt === 'yes' ? 'Sí' : opt === 'no' ? 'No' : 'Depende'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right summary */}
            <aside className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-neutral-900">Resumen</h3>
                <ul className="mt-3 text-sm text-neutral-800 space-y-1">
                  <li>
                    <span className="text-neutral-500">Nivel:</span> <span className="font-medium">{labelMap[norm]}</span>
                  </li>
                  <li>
                    <span className="text-neutral-500">Mascotas:</span> <span className="font-medium">{totalPets}</span>
                  </li>
                  <li>
                    <span className="text-neutral-500">Tamaño:</span>{' '}
                    <span className="font-medium">{size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande'}</span>
                  </li>
                  <li>
                    <span className="text-neutral-500">Transporte:</span>{' '}
                    <span className="font-medium capitalize">
                      {size === 'large' && transport === 'cabina' ? 'bodega' : transport}
                    </span>
                  </li>
                  {premium && (
                    <>
                      {hotelPref.trim() && (
                        <li>
                          <span className="text-neutral-500">Hotel:</span> <span className="font-medium">{hotelPref.trim()}</span>
                        </li>
                      )}
                      {airlinePref !== 'none' && (
                        <li>
                          <span className="text-neutral-500">Aerolínea:</span> <span className="font-medium">{airlinePref}</span>
                        </li>
                      )}
                      <li>
                        <span className="text-neutral-500">Paseos/día:</span> <span className="font-medium">{walksPerDay}</span>
                      </li>
                      <li>
                        <span className="text-neutral-500">Con niños:</span>{' '}
                        <span className="font-medium">{kidFriendly === 'yes' ? 'Sí' : kidFriendly === 'no' ? 'No' : 'Depende'}</span>
                      </li>
                      <li>
                        <span className="text-neutral-500">Con perros:</span>{' '}
                        <span className="font-medium">{dogFriendly === 'yes' ? 'Sí' : dogFriendly === 'no' ? 'No' : 'Depende'}</span>
                      </li>
                    </>
                  )}
                </ul>

                <div className="mt-5 p-4 rounded-2xl bg-neutral-900 text-white">
                  <p className="text-[11px] uppercase tracking-wide opacity-80">Estimación (tope de referencia)</p>
                  <p className="text-3xl font-bold mt-1">US$ {estimate}</p>
                  <p className="text-[11px] mt-1 opacity-80">Se ajusta por tamaño, transporte y mascotas adicionales.</p>
                </div>

                {/* CTA principal (si quisieras ir directo a basic-config) */}
                <Link
                  href={continueHref}
                  className="mt-4 inline-flex w-full h-12 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 items-center justify-center"
                >
                  Continuar
                </Link>

                {/* CTA volver a niveles */}
                <button
                  type="button"
                  onClick={() => {
                    if (onBackToLevels) onBackToLevels();
                    else
                      document
                        .getElementById('paws-planner-top')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="mt-3 inline-flex w-full h-11 rounded-xl bg-neutral-200 text-neutral-800 font-medium hover:bg-neutral-300 items-center justify-center"
                >
                  ← Volver a Niveles de Experiencia
                </button>

                {/* CTA siguiente SOLO si premium */}
                {premium && (
                  <button
                    type="button"
                    onClick={() => onNextToEscape && onNextToEscape()}
                    className="mt-2 inline-flex w-full h-11 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 items-center justify-center"
                  >
                    Siguiente: 🌟 Tipo de escapada →
                  </button>
                )}

                <p className="text-[11px] text-neutral-500 mt-2">
                  * Estimación orientativa. Reglas y costos varían por aerolínea/hotel.
                </p>
              </motion.div>
            </aside>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
