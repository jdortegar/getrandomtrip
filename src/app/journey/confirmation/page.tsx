'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ChatFab from '@/components/chrome/ChatFab';
import AuthModal from '@/components/auth/AuthModal';
import { useStore } from '@/store/store';
import { buildICS } from '@/lib/ics';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/Button';
import { Calendar, Share2, Mail } from 'lucide-react';
import { useUserStore } from '@/store/slices/userStore';
import { useCountdown } from '@/hooks/useCountdown';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function ConfirmationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { isAuthed, authModalOpen, closeAuth } = useUserStore();
  const { logistics, type, resetJourney } = useStore();
  const [tripData, setTripData] = useState<any>(null);

  // Use countdown hook for time remaining calculation
  const timeLeft = useCountdown(tripData?.startDate || logistics.startDate);

  // Get MercadoPago callback parameters
  const paymentId = searchParams.get('payment_id');
  const paymentStatus = searchParams.get('status');
  const merchantOrderId = searchParams.get('merchant_order_id');
  const externalReference = searchParams.get('external_reference');

  // Determine if payment was successful
  const isPaymentSuccessful =
    paymentId && (paymentStatus === 'approved' || paymentStatus === 'pending');

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Open auth modal if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isAuthed) {
      // Open auth modal using the user store
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
    }
  }, [session, isAuthed, status]);

  // Fetch trip data from database
  useEffect(() => {
    if (externalReference) {
      console.log(
        'Fetching trip data for external reference:',
        externalReference,
      );
      console.log('Current session:', session);
      console.log('Current auth status:', { isAuthed, status });

      const fetchTripData = async () => {
        try {
          console.log(`Making request to: /api/trips/${externalReference}`);
          const response = await fetch(`/api/trips/${externalReference}`);
          console.log('Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Trip data fetched:', data.trip);
            console.log('Trip originCity:', data.trip?.originCity);
            console.log('Trip originCountry:', data.trip?.originCountry);
            console.log('Trip startDate:', data.trip?.startDate);
            console.log('Trip endDate:', data.trip?.endDate);
            setTripData(data.trip); // API returns { trip: {...} }
          } else {
            const errorData = await response.json();
            console.error(
              'Failed to fetch trip data:',
              response.status,
              errorData,
            );
          }
        } catch (error) {
          console.error('Error fetching trip data:', error);
        }
      };

      fetchTripData();
    }
  }, [externalReference, session, isAuthed, status]);

  // Handle payment confirmation when page loads
  useEffect(() => {
    if (isPaymentSuccessful && paymentId && externalReference) {
      // Call API to confirm payment
      const confirmPayment = async () => {
        try {
          const response = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId,
              externalReference,
              merchantOrderId,
              status: paymentStatus,
            }),
          });

          if (response.ok) {
            console.log('Payment confirmed successfully');
          } else {
            console.error('Failed to confirm payment');
          }
        } catch (error) {
          console.error('Error confirming payment:', error);
        }
      };

      confirmPayment();
    }
  }, [
    isPaymentSuccessful,
    paymentId,
    externalReference,
    merchantOrderId,
    paymentStatus,
  ]);

  // Clear store when user leaves confirmation page to start fresh for next trip
  useEffect(() => {
    return () => {
      if (isPaymentSuccessful) {
        resetJourney();
      }
    };
  }, [isPaymentSuccessful, resetJourney]);

  // Show loading while checking auth
  if (status === 'loading') {
    return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
  }

  const startDate = tripData?.startDate
    ? new Date(tripData.startDate)
    : logistics.startDate
      ? new Date(logistics.startDate)
      : undefined;
  const endDate = tripData?.endDate
    ? new Date(tripData.endDate)
    : logistics.endDate
      ? new Date(logistics.endDate)
      : startDate
        ? new Date(
            startDate.getTime() +
              (tripData?.nights || logistics.nights || 1) * 86400000,
          )
        : undefined;

  const title =
    `${tripData?.type || type || 'randomtrip'}`.toUpperCase() +
    ' – Viaje confirmado';
  const location = [
    tripData?.originCity || logistics.city,
    tripData?.originCountry || logistics.country,
  ]
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
        className="!h-[40vh]"
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

            {/* Payment Status Indicator */}
            {isPaymentSuccessful && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-center gap-2 text-green-800">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Pago confirmado</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  ID de pago: {paymentId} • Estado:{' '}
                  {paymentStatus === 'approved' ? 'Aprobado' : 'Pendiente'}
                </p>
              </div>
            )}

            {/* Trip Details */}
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-md border border-gray-300 bg-gray-50 mb-6">
              <div className="text-center">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                  Salida desde
                </div>
                <div className="font-semibold text-neutral-900">
                  {tripData?.originCity || logistics.city || '—'}
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300" />

              <div className="text-center">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                  Fechas
                </div>
                <div className="font-semibold text-neutral-900 whitespace-nowrap">
                  {startDate ? startDate.toLocaleDateString() : '—'} →{' '}
                  {endDate ? endDate.toLocaleDateString() : '—'}
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300" />

              <div className="text-center">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                  Comienza en
                </div>
                <div className="font-semibold text-green-600">{timeLeft}</div>
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

      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuth}
        defaultMode="login"
      />
    </>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <>
          <Hero
            content={{
              title: 'Procesando...',
              subtitle: 'Confirmando tu pago',
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
      }
    >
      <ConfirmationPageContent />
    </Suspense>
  );
}
