'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { usePayment } from '@/hooks/usePayment';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, CreditCard, RefreshCw } from 'lucide-react';

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
        <div className="max-w-3xl mx-auto">
          {isReturnFromMP ? (
            <>
              {/* Payment Cancelled/Failed Card */}
              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center mb-6">
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

              {/* Help Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 ¿Necesitas ayuda?
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Verifica que tu tarjeta tenga fondos suficientes</li>
                  <li>
                    • Asegúrate de que los datos de tu tarjeta sean correctos
                  </li>
                  <li>• Intenta con otro método de pago</li>
                  <li>
                    • Si el problema persiste, contacta a{' '}
                    <a
                      href="mailto:soporte@getrandomtrip.com"
                      className="underline hover:text-blue-900"
                    >
                      soporte@getrandomtrip.com
                    </a>
                  </li>
                </ul>
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
      </Section>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <>
          <Hero
            content={{
              title: 'Cargando...',
              subtitle: 'Preparando pago',
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
      <CheckoutPageContent />
    </Suspense>
  );
}
