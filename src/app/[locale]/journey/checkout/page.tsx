'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { usePayment } from '@/hooks/usePayment';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Loader2,
  RefreshCw,
} from 'lucide-react';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { basePriceUsd, logistics, filters, addons } = useStore();

  // Get MercadoPago callback parameters
  const paymentStatus = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const preferenceId = searchParams.get('preference_id');

  // Payment hook
  const { isProcessing, calculateTotals, initiatePayment } = usePayment({
    basePriceUsd: basePriceUsd || 0,
    logistics,
    filters,
    addons,
  });

  const totals = calculateTotals();

  // Determine if this is a return from MercadoPago
  const isReturnFromMP =
    searchParams.has('preference_id') || searchParams.has('status');
  const isPaymentCancelled = paymentStatus === 'null' || paymentStatus === null;

  const handleRetryPayment = async () => {
    if (externalReference) {
      await initiatePayment(externalReference);
    } else {
      router.push('/journey/summary');
    }
  };

  return (
    <>
      <Hero
        content={{
          title: isReturnFromMP ? 'Pago Pendiente' : 'Procesando Pago',
          subtitle: isReturnFromMP
            ? 'Completa tu pago para confirmar tu viaje'
            : 'Redirigiendo a MercadoPago...',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="flex gap-6 w-full font-jost">
          {/* Main Content */}
          <div className="flex-1">
            {isReturnFromMP ? (
              <>
                {/* Payment Cancelled/Failed Card */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-6">
                    <AlertTriangle className="w-10 h-10 text-yellow-600" />
                  </div>

                  <h1 className="text-3xl font-bold text-neutral-900 mb-4 font-jost">
                    Pago No Completado
                  </h1>

                  <p className="text-neutral-600 mb-8 text-lg">
                    {isPaymentCancelled
                      ? 'El pago fue cancelado. Puedes volver a intentarlo cuando estés listo.'
                      : 'Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.'}
                  </p>

                  {/* Payment Details */}
                  {externalReference && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-neutral-600 mb-2">
                        Referencia del viaje
                      </div>
                      <div className="font-mono text-xs text-neutral-900 break-all">
                        {externalReference}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-700">Precio Base</span>
                      <span className="font-semibold text-neutral-900">
                        ${totals.basePerPax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-700">Filtros</span>
                      <span className="font-semibold text-neutral-900">
                        ${totals.filtersPerPax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-neutral-700">Add-ons</span>
                      <span className="font-semibold text-neutral-900">
                        $
                        {(
                          totals.addonsPerPax + totals.cancelInsurancePerPax
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-blue-300">
                      <span className="text-lg font-semibold text-neutral-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${totals.totalTrip.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={handleRetryPayment}
                      disabled={isProcessing}
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Reintentar Pago
                        </>
                      )}
                    </Button>

                    <Button variant="secondary" size="lg" asChild>
                      <Link href="/journey/summary">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Resumen
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Loading state - redirecting to MercadoPago
              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
                  <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                </div>

                <h1 className="text-2xl font-bold text-neutral-900 mb-4 font-jost">
                  Procesando...
                </h1>

                <p className="text-neutral-600">
                  Estamos preparando tu pago. Serás redirigido en un momento.
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Help Info */}
          <aside className="sticky top-20 self-start w-80 flex-shrink-0 max-w-[300px]">
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-neutral-900 mb-4 text-lg">
                ¿Necesitas ayuda?
              </h3>
              <ul className="text-sm text-neutral-700 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">•</span>
                  <span>Verifica que tu tarjeta tenga fondos suficientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">•</span>
                  <span>
                    Asegúrate de que los datos de tu tarjeta sean correctos
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">•</span>
                  <span>Intenta con otro método de pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-semibold">•</span>
                  <span>
                    Si el problema persiste, contacta a{' '}
                    <a
                      href="mailto:soporte@getrandomtrip.com"
                      className="text-primary underline hover:text-primary/80"
                    >
                      soporte@getrandomtrip.com
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<LoadingSpinner />}
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
