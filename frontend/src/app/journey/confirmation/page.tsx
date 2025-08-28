'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ChatFab from '@/components/chrome/ChatFab';
import BgCarousel from '@/components/ui/BgCarousel';
import GlassCard from '@/components/ui/GlassCard';
import { useJourneyStore } from '@/store/journeyStore';
import { buildICS } from '@/lib/ics';

export default function ConfirmationPage() {
  const { logistics, type } = useJourneyStore();
  const [left, setLeft] = useState<string>('—');

  useEffect(() => {
    const tick = () => {
      if (!logistics.startDate) return setLeft('—');
      const now = new Date();
      const start = new Date(logistics.startDate);
      const ms = +start - +now;
      if (ms <= 0) return setLeft('¡Es hoy!');
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setLeft(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [logistics.startDate]);

  // --- ICS seguro: pasamos Date|string válidos y NO reenvolvemos la data URL ---
  const startDate =
    logistics.startDate ? new Date(logistics.startDate) : undefined;
  const endDate =
    logistics.endDate
      ? new Date(logistics.endDate)
      : startDate
        ? new Date(startDate.getTime() + (logistics.nights || 1) * 86400000)
        : undefined;

  const title = `${(type || 'randomtrip')}`.toUpperCase() + ' – Viaje confirmado';
  const location = [logistics.city?.name, logistics.country?.name].filter(Boolean).join(', ');
  const icsHref = buildICS(title, startDate, endDate, location);

  return (
    <>
      <Navbar />
      <div id="hero-sentinel" aria-hidden className="h-px w-px" />
      <BgCarousel scrim={0.6} />
      <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16 max-w-3xl">
        <GlassCard>
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-neutral-900">¡Viaje reservado!</div>
            <p className="mt-2 text-neutral-700">
              Tu destino será revelado 48 h antes del viaje.
            </p>

            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900">
              <span className="font-medium">{logistics.city?.name ?? '—'}</span>
              <span>·</span>
              <span>{logistics.startDate ?? '—'} → {logistics.endDate ?? '—'}</span>
            </div>

            <div className="mt-4 text-sm text-neutral-700">
              Comienza en <span className="font-semibold text-neutral-900">{left}</span>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={icsHref}
                download="randomtrip.ics"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50"
              >
                Agregar al calendario
              </a>

              {/* compartir rápido */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent('¡Viaje reservado en Randomtrip! 🎒')}`}
                target="_blank"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50"
              >
                Compartir por WhatsApp
              </a>
              <a
                href={`mailto:?subject=Mi%20Randomtrip&body=${encodeURIComponent('¡Ya tengo mi Randomtrip!')}`}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50"
              >
                Compartir por Email
              </a>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"
              >
                Ir a Mis Viajes
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-neutral-50"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </GlassCard>
      </main>
      <ChatFab />
    </>
  );
}
