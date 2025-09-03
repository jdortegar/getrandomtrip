// frontend/src/components/tripper/TripperIntroVideoGate.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  /** ID de YouTube (no la URL completa). Ej: "1d4OiltwQYs" */
  youtubeId?: string;
  /** Fuerza mostrar siempre (útil para QA). */
  forceShow?: boolean;
  /** Clave base de sessionStorage; se le añade el pathname para que sea por página. */
  storageKey?: string;
};

/**
 * Muestra un modal con video cuando el usuario llega directamente
 * al landing del tripper (referrer externo) y no lo vio antes.
 */
export default function TripperIntroVideoGate({
  youtubeId = '1d4OiltwQYs',
  forceShow = false,
  storageKey = 'rt_tripper_intro_seen',
}: Props) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Clave por página (evita que ver el video en un tripper bloquee otros)
  const derivedKey = useMemo(() => {
    if (typeof window === 'undefined') return storageKey;
    try {
      const path = window.location?.pathname || '';
      return `${storageKey}:${path}`;
    } catch {
      return storageKey;
    }
  }, [storageKey]);

  const videoSrc = useMemo(() => {
    const base = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1', // autoplay más fiable en mobile
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
    });
    return `${base}?${params.toString()}`;
  }, [youtubeId]);

  useEffect(() => {
    if (forceShow) {
      setOpen(true);
      return;
    }
    if (typeof window === 'undefined') return;

    // ya lo vio
    if (sessionStorage.getItem(derivedKey) === '1') return;

    // si viene de la misma web (home u otra interna) => no mostrar
    const ref = document.referrer;
    const sameOrigin =
      !!ref && !!window.location.origin && ref.startsWith(window.location.origin);

    // permite desactivar con ?novideo=1
    const url = new URL(window.location.href);
    const noVideo = url.searchParams.get('novideo') === '1';

    if (!sameOrigin && !noVideo) setOpen(true);
  }, [forceShow, derivedKey]);

  // Bloquea scroll del body y ESC para cerrar
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
    }

    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  function closeModal() {
    setOpen(false);
    if (dontShowAgain) {
      try {
        sessionStorage.setItem(derivedKey, '1');
      } catch {}
    }
  }

  if (!open) return null;

  const titleId = 'rt-tripper-intro-title';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

      {/* Modal */}
      <div className="relative z-[81] w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 id={titleId} className="text-sm text-neutral-700">
            ¿Primera vez por acá? Te contamos en 40s 👇
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={closeModal}
            className="rounded-md p-2 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="aspect-video w-full bg-black">
          <iframe
            className="h-full w-full"
            src={videoSrc}
            title="Intro Randomtrip"
            allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            No volver a mostrar
          </label>

          <button
            type="button"
            onClick={closeModal}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-white text-sm font-semibold hover:bg-neutral-800"
          >
            Empezar
          </button>
        </div>
      </div>
    </div>
  );
}
