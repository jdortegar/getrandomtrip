'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ChatFab from '@/components/chrome/ChatFab';
import { useStore } from '@/store/store';
import {
  computeAddonsCostPerTrip,
  computeFiltersCostPerTrip,
} from '@/lib/pricing';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/slices/userStore';
import { ADDONS } from '@/data/addons-catalog';
import { Loader2 } from 'lucide-react';

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

  const goConfirm = () => router.push('/journey/confirmation');

  const handleMercadoPago = async () => {
    setIsProcessing(true);
    try {
      const payload = {
        total: totalTrip,
        tripId: `trip-${Date.now()}`,
        userEmail: session?.user?.email || 'cliente@example.com',
        userName: session?.user?.name || 'Cliente',
      };

      console.log('Payload:', payload);

      const response = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
                  onClick={handleMercadoPago}
                  disabled={isProcessing}
                  className="w-full !text-left"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Procesando...
                    </div>
                  ) : (
                    'Pagar con Mercado Pago'
                  )}
                </Button>

                {/* Other Payment Methods - Demo */}
                {/* <div className="grid grid-cols-2 gap-4">
                  {['PayPal', 'Apple Pay', 'Stripe'].map((brand) => (
                    <button
                      key={brand}
                      onClick={goConfirm}
                      className="rounded-md border border-gray-300 bg-white py-4 text-neutral-900 hover:bg-gray-50 transition-colors font-medium opacity-60"
                      disabled
                    >
                      {brand} (Demo)
                    </button>
                  ))}
                </div> */}
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

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-semibold text-neutral-900">
                  Total (x{pax})
                </span>
                <span className="text-xl font-bold text-neutral-900">
                  {usd(totalTrip)}
                </span>
              </div>

              {/* <Button className="w-full" onClick={goConfirm} size="lg">
                Pagar
              </Button> */}

              <p className="text-xs text-neutral-500 text-center mt-4">
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
