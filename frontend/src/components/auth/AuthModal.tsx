'use client';

import { useEffect, useRef, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { useUserStore } from '@/store/userStore';

type Budget = 'low' | 'mid' | 'high' | '';
type Traveler = 'solo' | 'pareja' | 'familia' | 'amigos' | 'empresa' | '';
type Step = 0 | 1 | 2;

const ALL_INTERESTS = [
  'playa',
  'montaña',
  'gastronomía',
  'vida-nocturna',
  'cultura',
  'naturaleza',
  'ciudad',
  'pueblos',
];

const ALL_DISLIKES = ['frío', 'calor-extremo', 'multitudes', 'madrugar'];

export default function AuthModal() {
  // 1) Hooks del store SIEMPRE al tope
  const {
    isAuthed,
    user,
    closeAuth,
    signInDemo,
    upsertPrefs,
    authModalOpen, // flag del modal en el store
  } = useUserStore();

  const open = authModalOpen;

  // 2) Hooks locales SIEMPRE, con valores neutros
  const [step, setStep] = useState<Step>(0); // 0: sign, 1: preguntas, 2: review
  const [travelerType, setTravelerType] = useState<Traveler>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [budget, setBudget] = useState<Budget>('');

  const dialogRef = useRef<HTMLDivElement | null>(null);

  // 3) Al abrir el modal, hidratar desde user (si existe) y decidir step inicial
  useEffect(() => {
    if (!open) return;

    // si ya está logueado, vamos directo a preguntas; si no, step 0
    setStep(isAuthed ? 1 : 0);

    // hidratar desde user si hay datos
    setTravelerType((user?.prefs?.travelerType as Traveler) ?? '');
    setInterests(user?.prefs?.interests ?? []);
    setDislikes(user?.prefs?.dislikes ?? []);
    setBudget((user?.prefs?.budget as Budget) ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAuthed]);

  // 4) Cerrar con Escape / click afuera (sin hooks condicionales)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuth();
    const onClick = (e: MouseEvent) => {
      if (!dialogRef.current) return;
      if (!dialogRef.current.contains(e.target as Node)) closeAuth();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, closeAuth]);

  // 5) Listener global "open-auth" (compatibilidad sin @ts-ignore/@ts-expect-error)
  useEffect(() => {
    const h = () => {
      const { openAuth } = useUserStore.getState() as any;
      if (typeof openAuth === 'function') openAuth();
    };
    (window as any).addEventListener('open-auth', h);
    return () => (window as any).removeEventListener('open-auth', h);
  }, []);

  // 6) Si está cerrado, retornar null (después de todos los hooks declarados)
  if (!open) return null;

  // 7) Handlers

  const toggleIn = (v: string) =>
    setInterests((curr) =>
      curr.includes(v) ? curr.filter((i) => i !== v) : [...curr, v],
    );

  const toggleDis = (v: string) =>
    setDislikes((curr) =>
      curr.includes(v) ? curr.filter((i) => i !== v) : [...curr, v],
    );

  const savePrefs = () => {
    upsertPrefs?.({
      travelerType: travelerType || undefined,
      interests,
      dislikes,
      budget: (budget || undefined) as any,
    });
    setStep(2);
  };

  const finish = () => {
    try {
      if (location.pathname.includes('/journey/basic-config')) {
        console.info('¡Listo! Preferencias guardadas 👌');
      }
    } catch {}
    closeAuth();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div ref={dialogRef} className="w-full max-w-lg">
        <GlassCard>
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {step === 0 && 'Bienvenido/a'}
                {step === 1 && 'Cuéntanos sobre tus gustos'}
                {step === 2 && '¡Todo listo!'}
              </h2>
              <button
                aria-label="Cerrar"
                onClick={closeAuth}
                className="rounded-lg p-2 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="mt-4">
              {step === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-700">
                    Inicia sesión o crea tu cuenta (demo).
                  </p>
                  <div className="grid gap-2">
                    <button
                      onClick={() => signInDemo('client')}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50"
                    >
                      Continuar con email (demo) - User
                    </button>
                    <button
                      onClick={() => signInDemo('tripper')}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50"
                    >
                      Continuar con email (demo) - Tripper
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-medium text-neutral-900 mb-2">
                      ¿Cómo viajás normalmente?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          'solo',
                          'pareja',
                          'familia',
                          'amigos',
                          'empresa',
                        ] as Traveler[]
                      ).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTravelerType(t)}
                          className={
                            'rounded-full border px-3 py-1 text-sm ' +
                            (travelerType === t
                              ? 'border-violet-300 bg-violet-50 text-violet-900'
                              : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50')
                          }
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-neutral-900 mb-2">
                      ¿Qué te gusta?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_INTERESTS.map((v) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() => toggleIn(v)}
                          className={
                            'rounded-full border px-3 py-1 text-sm ' +
                            (interests.includes(v)
                              ? 'border-violet-300 bg-violet-50 text-violet-900'
                              : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50')
                          }
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-neutral-900 mb-2">
                      ¿Qué evitás?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_DISLIKES.map((v) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() => toggleDis(v)}
                          className={
                            'rounded-full border px-3 py-1 text-sm ' +
                            (dislikes.includes(v)
                              ? 'border-amber-300 bg-amber-50 text-amber-900'
                              : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50')
                          }
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-neutral-900 mb-2">
                      Presupuesto típico
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['low', 'mid', 'high'] as Budget[]).map((b) => (
                        <button
                          key={b}
                          onClick={() => setBudget(b)}
                          className={
                            'rounded-full border px-3 py-1 text-sm ' +
                            (budget === b
                              ? 'border-violet-300 bg-violet-50 text-violet-900'
                              : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50')
                          }
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2 text-sm">
                  <div className="text-neutral-700">
                    Listo, {user?.name ?? 'Randomtripper'}.
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">Tipo:</span>{' '}
                    {travelerType || '—'}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">Likes:</span>{' '}
                    {interests.length ? interests.join(', ') : '—'}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">
                      Dislikes:
                    </span>{' '}
                    {dislikes.length ? dislikes.join(', ') : '—'}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">
                      Budget:
                    </span>{' '}
                    {budget || '—'}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-between">
              <button
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : 0))}
                disabled={step === 0}
              >
                Atrás
              </button>

              {step === 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => signInDemo('client')}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {step === 1 && (
                <button
                  onClick={savePrefs}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"
                >
                  Guardar preferencias
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={finish}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"
                >
                  Terminar
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
