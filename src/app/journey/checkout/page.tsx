'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

import ChatFab from '@/components/chrome/ChatFab';
import Hero from '@/components/Hero';
import Section from '@/components/layout/Section';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/store';
import { useUserStore } from '@/store/slices/userStore';
import { ADDONS } from '@/data/addons-catalog';
import { computeFiltersCostPerTrip } from '@/lib/pricing';

const usd = (n: number) => `USD ${n.toFixed(2)}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAuthed } = useUserStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { basePriceUsd, logistics, filters, addons } = useStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isAuthed) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?returnTo=${encodeURIComponent(currentPath)}`);
    }
  }, [session, isAuthed, status, router]);

  // Don't render if not authenticated (will redirect)
  if (!session && !isAuthed) {
    return null;
  }

  const pax = logistics.pax || 1;
  const basePerPax = basePriceUsd || 0;

  // Calculate filters cost (not split by pax)
  const filtersTrip = computeFiltersCostPerTrip(filters, pax);
  const filtersPerPax = filtersTrip;

  // Calculate addons cost per person (excluding cancellation insurance)
  let addonsPerPax = 0;
  const hasCancelInsurance = addons.selected.some((s) => s.id === 'cancel-ins');

  addons.selected.forEach((s) => {
    const a = ADDONS.find((x) => x.id === s.id);
    if (!a || a.id === 'cancel-ins') return; // Skip cancel-ins for now

    const qty = s.qty || 1;
    const totalPrice = a.price * qty;

    if (a.type === 'perPax') {
      // For perPax, show individual price (total / qty)
      addonsPerPax += totalPrice / qty;
    } else {
      // For perTrip, divide by number of passengers
      addonsPerPax += totalPrice / pax;
    }
  });

  // Calculate subtotal before cancellation insurance
  const subtotalPerPax = basePerPax + filtersPerPax + addonsPerPax;

  // Calculate cancellation insurance as 15% of subtotal
  const cancelInsurancePerPax = hasCancelInsurance ? subtotalPerPax * 0.15 : 0;

  // Calculate totals
  const totalAddonsPerPax = addonsPerPax + cancelInsurancePerPax;
  const totalPerPax = basePerPax + filtersPerPax + totalAddonsPerPax;
  const totalTrip = totalPerPax * pax;

  const handleMercadoPago = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total: totalTrip,
          tripId: `trip-${Date.now()}`,
          userEmail: session?.user?.email || 'cliente@example.com',
          userName: session?.user?.name || 'Cliente',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment preference');
      }

      const { init_point } = await response.json();
      window.location.href = init_point;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error al procesar el pago. Intenta nuevamente.');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Hero
        content={{
          title: 'Checkout',
          subtitle: 'Último paso antes de tu aventura sorpresa',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="flex gap-6 w-full">
          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <h1 className="text-xl font-semibold text-neutral-900 mb-3">
                Pasarela de pago
              </h1>

              <div className="space-y-4">
                {/* Mercado Pago - Primary Option */}
                <Button
                  disabled={isProcessing}
                  onClick={handleMercadoPago}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando...
                    </div>
                  ) : (
                    'Pagar con Mercado Pago'
                  )}
                </Button>

                {/* Fallback redirect button */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>¿No te redirigió automáticamente?</strong>
                  </p>
                  <p className="text-xs text-blue-600 mb-3">
                    Si después del pago no regresas automáticamente, haz clic en
                    el botón de abajo:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = '/journey/confirmation')
                    }
                    className="w-full"
                  >
                    Ir a Confirmación
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <aside className="sticky top-20 self-start w-80 flex-shrink-0">
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Resumen de compra
              </h2>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Base por persona</span>
                  <span className="text-neutral-900">{usd(basePerPax)}</span>
                </div>
                {filtersPerPax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Filtros premium</span>
                    <span className="text-neutral-900">
                      {usd(filtersPerPax)}
                    </span>
                  </div>
                )}
                {totalAddonsPerPax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Add-ons</span>
                    <span className="text-neutral-900">
                      {usd(totalAddonsPerPax)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Total por persona</span>
                  <span className="text-neutral-900 font-medium">
                    {usd(totalPerPax)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-neutral-900">
                  Total (x{pax})
                </span>
                <span className="text-xl font-bold text-neutral-900">
                  {usd(totalTrip)}
                </span>
              </div>

              <p className="text-xs text-neutral-500 text-center mt-6">
                Pago seguro y protegido
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <ChatFab />
    </>
  );
}
