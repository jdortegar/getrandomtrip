'use client';

import { useEffect, useRef, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { useUserStore } from '@/store/userStore';

type Budget = 'low'|'mid'|'high'|''; // mantener compatible con store
type Traveler =
  | 'solo'
  | 'pareja'
  | 'familia'
  | 'amigos'
  | 'empresa'
  | '';

const ALL_INTERESTS = [
  'playa','montaña','gastronomía','vida-nocturna','cultura','naturaleza','ciudad','pueblos',
];
const ALL_DISLIKES = ['frío','calor-extremo','multitudes','madrugar'];

export default function AuthModal() {
  // 1) Hooks del store SIEMPRE al tope
  const {
    // usa los nombres EXACTOS que ya tiene tu store
    isAuthed,
    user,
    closeAuth,
    signInDemo,
    upsertPrefs,
    authModalOpen, // Use the correct name from your store
  } = useUserStore();

  const open = authModalOpen; // Directly use authModalOpen

  // 2) Hooks locales SIEMPRE, con valores neutros
  const [step, setStep] = useState<0|1|2>(0); // 0: sign, 1: preguntas, 2: review
  const [travelerType, setTravelerType] = useState<Traveler>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [budget, setBudget] = useState<Budget>('');

  const dialogRef = useRef<HTMLDivElement|null>(null);

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

  // 5) Listener global "open-auth" (si existía en tu versión)
  useEffect(() => {
    const h = () => {
      // si tu store expone openAuth() úsalo
      try { useUserStore.getState().openAuth(); } catch {} // Directly call openAuth
    };
    window.addEventListener('open-auth', h as any);
    return () => window.removeEventListener('open-auth', h as any);
  }, []);

  // 6) Si está cerrado, retornar null (después de todos los hooks declarados)
  if (!open) return null;

  // 7) Handlers
  const doSignIn = () => {
    // demo sign-in -> deja usuario “logueado”
    signInDemo?.();
    setStep(1);
  };

  const toggleIn = (v: string) =>
    setInterests((curr) => (curr.includes(v) ? curr.filter(i => i !== v) : [...curr, v]));

  const toggleDis = (v: string) =>
    setDislikes((curr) => (curr.includes(v) ? curr.filter(i => i !== v) : [...curr, v]));

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
    // opcional: toast acá si estás en basic-config
    try {
      if (location.pathname.includes('/journey/basic-config')) {
        // no dependas de libs, usa alert como placeholder
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
                    <button onClick={doSignIn} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50">
                      Continuar con Google (demo)
                    </button>
                    <button onClick={doSignIn} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50">
                      Continuar con Apple (demo)
                    </button>
                    <button onClick={doSignIn} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50">
                      Continuar con Facebook (demo)
                    </button>
                    <div className="h-px bg-neutral-200 my-2" />
                    <button onClick={doSignIn} className="rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-500">
                      Continuar con email (demo)
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-medium text-neutral-900 mb-2">¿Cómo viajás normalmente?</div>
                    <div className="flex flex-wrap gap-2">
                      {(['solo','pareja','familia','amigos','empresa'] as Traveler[]).map(t => (
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
                    &lt;/div&gt;
                  &lt;/div&gt;

                  &lt;div&gt;
                    &lt;div className="text-sm font-medium text-neutral-900 mb-2"&gt;¿Qué te gusta?&lt;/div&gt;
                    &lt;div className="flex flex-wrap gap-2"&gt;
                      {ALL_INTERESTS.map(v =&gt; (
                        &lt;button
                          type="button"
                          key={v}
                          onClick={() =&gt; toggleIn(v)}
                          className={
                            'rounded-full border px-3 py-1 text-sm ' +
                            (interests.includes(v)
                              ? 'border-violet-300 bg-violet-50 text-violet-900'
                              : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50')
                          }
                        &gt;
                          {v}
                        &lt;/button&gt;
                      ))}
                    &lt;/div&gt;
                  &lt;/div&gt;

                  &lt;div&gt;
                    &lt;div className="text-sm font-medium text-neutral-900 mb-2"&gt;¿Qué evitás?&lt;/div&gt;
                    &lt;div className="flex flex-wrap gap-2"&gt;
                      {ALL_DISLIKES.map(v =&gt; (
                        &lt;button
                          type="button"
                          key={v}
                          onClick={() =&gt; toggleDis(v)}
                          className={
                            'rounded-full border px-3 py-1 text-sm ' +
                            (dislikes.includes(v)
                              ? 'border-amber-300 bg-amber-50 text-amber-900'
                              : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50')
                          }
                        &gt;
                          {v}
                        &lt;/button&gt;
                      ))}
                    &lt;/div&gt;
                  &lt;/div&gt;

                  &lt;div&gt;
                    &lt;div className="text-sm font-medium text-neutral-900 mb-2"&gt;Presupuesto típico&lt;/div&gt;
                    &lt;div className="flex flex-wrap gap-2"&gt;
                      {(['low','mid','high'] as Budget[]).map(b =&gt; (
                        &lt;button
                          key={b}
                          onClick={() =&gt; setBudget(b)}
                          className={
                            'rounded-full border px-3 py-1 text-sm ' +
                            (budget === b
                              ? 'border-violet-300 bg-violet-50 text-violet-900'
                              : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50')
                          }
                        &gt;
                          {b}
                        &lt;/button&gt;
                      ))}
                    &lt;/div&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              )}

              {step === 2 && (
                &lt;div className="space-y-2 text-sm"&gt;
                  &lt;div className="text-neutral-700"&gt;Listo, {user?.name ?? 'Randomtripper'}.&lt;/div&gt;
                  &lt;div&gt;&lt;span className="font-medium text-neutral-900"&gt;Tipo:&lt;/span&gt; {travelerType || '—'}&lt;/div&gt;
                  &lt;div&gt;&lt;span className="font-medium text-neutral-900"&gt;Likes:&lt;/span&gt; {interests.length ? interests.join(', ') : '—'}&lt;/div&gt;
                  &lt;div&gt;&lt;span className="font-medium text-neutral-900"&gt;Dislikes:&lt;/span&gt; {dislikes.length ? dislikes.join(', ') : '—'}&lt;/div&gt;
                  &lt;div&gt;&lt;span className="font-medium text-neutral-900"&gt;Budget:&lt;/span&gt; {budget || '—'}&lt;/div&gt;
                &lt;/div&gt;
              )}
            &lt;/div&gt;

            {/* Footer */}
            &lt;div className="mt-6 flex justify-between"&gt;
              &lt;button
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                onClick={() =&gt; setStep((s) =&gt; Math.max(0, s - 1))}
                disabled={step === 0}
              &gt;
                Atrás
              &lt;/button&gt;

              {step === 0 && (
                &lt;div className="flex gap-2"&gt;
                  &lt;button onClick={doSignIn} className="rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"&gt;
                    Continuar
                  &lt;/button&gt;
                &lt;/div&gt;
              )}

              {step === 1 && (
                &lt;button
                  onClick={savePrefs}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"
                &gt;
                  Guardar preferencias
                &lt;/button&gt;
              )}

              {step === 2 && (
                &lt;button onClick={finish} className="rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"&gt;
                  Terminar
                &lt;/button&gt;
              )}
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/GlassCard&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}