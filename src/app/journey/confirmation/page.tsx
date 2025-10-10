'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ChatFab from '@/components/chrome/ChatFab';
import { useStore } from '@/store/store';
import { buildICS } from '@/lib/ics';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { Calendar, Share2, Mail } from 'lucide-react';
import { useUserStore } from '@/store/slices/userStore';

export default function ConfirmationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAuthed } = useUserStore();
  const { logistics, type } = useStore();
  const [left, setLeft] = useState<string>('—');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isAuthed) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?returnTo=${encodeURIComponent(currentPath)}`);
    }
  }, [session, isAuthed, status, router]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <>
        <Hero
          content={{
            title: 'Cargando...',
            subtitle: 'Verificando tu sesión',
            videoSrc: '/videos/hero-video.mp4',
            fallbackImage: '/images/bg-playa-mexico.jpg',
          }}
        />
        <Section>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Section>
      </>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session && !isAuthed) {
    return null;
  }

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

  const startDate = logistics.startDate
    ? new Date(logistics.startDate)
    : undefined;
  const endDate = logistics.endDate
    ? new Date(logistics.endDate)
    : startDate
      ? new Date(startDate.getTime() + (logistics.nights || 1) * 86400000)
      : undefined;

  const title = `${type || 'randomtrip'}`.toUpperCase() + ' – Viaje confirmado';
  const location = [logistics.city, logistics.country]
    .filter(Boolean)
    .join(', ');
  const icsHref = buildICS(title, startDate, endDate, location);

  return (
    <>
      <Hero
        content={{
          title: '¡Reserva Confirmada!',
          subtitle: 'Tu aventura sorpresa está a punto de comenzar',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
      />

      <Section>
        <div className="max-w-4xl mx-auto">
          {/* Success Card */}
          <div className="bg-white p-8 rounded-md border border-gray-200 shadow-sm text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              ¡Viaje reservado con éxito!
            </h1>
            <p className="text-neutral-600 mb-6">
              Tu destino será revelado <strong>48 horas</strong> antes del
              viaje.
            </p>

            {/* Trip Details */}
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-md border border-gray-300 bg-gray-50 mb-6">
              <div className="text-left">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                  Destino
                </div>
                <div className="font-semibold text-neutral-900">
                  {logistics.city ?? '—'}
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300" />

              <div className="text-left">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                  Fechas
                </div>
                <div className="font-semibold text-neutral-900 whitespace-nowrap">
                  {startDate ? startDate.toLocaleDateString() : '—'} →{' '}
                  {endDate ? endDate.toLocaleDateString() : '—'}
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300" />

              <div className="text-left">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                  Comienza en
                </div>
                <div className="font-semibold text-green-600">{left}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" size="default" asChild>
                  <a href={icsHref} download="randomtrip.ics">
                    <Calendar className="w-4 h-4 mr-2" />
                    Agregar al calendario
                  </a>
                </Button>

                <Button variant="outline" size="default" asChild>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('¡Viaje reservado en Randomtrip! 🎒')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir por WhatsApp
                  </a>
                </Button>

                <Button variant="outline" size="default" asChild>
                  <a
                    href={`mailto:?subject=Mi%20Randomtrip&body=${encodeURIComponent('¡Ya tengo mi Randomtrip!')}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Compartir por Email
                  </a>
                </Button>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <Button size="lg" asChild>
                  <Link href="/dashboard">Ir a Mis Viajes</Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/">Volver al inicio</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              📧 ¿Qué sigue ahora?
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                • Recibirás un email de confirmación con todos los detalles
              </li>
              <li>• Te notificaremos 48h antes con tu destino sorpresa</li>
              <li>
                • Podrás gestionar tu viaje desde "Mis Viajes" en cualquier
                momento
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <ChatFab />
    </>
  );
}
