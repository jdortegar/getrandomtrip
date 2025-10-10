'use client';

import { useRouter } from 'next/navigation';
import ChatFab from '@/components/chrome/ChatFab';
import { useStore } from '@/store/store';
import {
  computeAddonsCostPerTrip,
  computeFiltersCostPerTrip,
} from '@/lib/pricing';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';

const usd = (n: number) => `USD ${n.toFixed(2)}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { basePriceUsd, logistics, filters, addons } = useStore();
  const pax = logistics.pax || 1;

  const filtersTrip = computeFiltersCostPerTrip(filters, pax);
  const { totalTrip: addonsTrip, cancelCost } = computeAddonsCostPerTrip(
    addons.selected,
    basePriceUsd,
    filtersTrip,
    pax,
  );

  const filtersPerPax = filtersTrip / pax || 0;
  const addonsPerPax = addonsTrip / pax || 0;
  const totalPerPax = basePriceUsd + filtersPerPax + addonsPerPax;
  const totalTrip = totalPerPax * pax;

  const goConfirm = () => router.push('/journey/confirmation');

  return (
    <>
      <Hero
        content={{
          title: 'Checkout',
          subtitle: 'Último paso antes de tu aventura sorpresa',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
      />

      <Section>
        <div className="flex gap-6 w-full">
          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <h1 className="text-xl font-semibold text-neutral-900 mb-3">
                Pasarela de pago
              </h1>
              <p className="text-sm text-neutral-700 mb-6">
                Elegí un método. Todos son <strong>demo</strong> por ahora.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {['Mercado Pago', 'PayPal', 'Apple Pay', 'Stripe'].map(
                  (brand) => (
                    <button
                      key={brand}
                      onClick={goConfirm}
                      className="rounded-md border border-gray-300 bg-white py-6 text-neutral-900 hover:bg-gray-50 transition-colors font-medium"
                    >
                      {brand}
                    </button>
                  ),
                )}
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs text-neutral-600">
                  💡 <strong>Demo Mode:</strong> No se realizará ningún cargo
                  real. Esta es una simulación del proceso de pago.
                </p>
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
                  <span className="text-neutral-600">Precio base</span>
                  <span className="text-neutral-900">
                    {usd(basePriceUsd * pax)}
                  </span>
                </div>
                {filtersTrip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Filtros premium</span>
                    <span className="text-neutral-900">{usd(filtersTrip)}</span>
                  </div>
                )}
                {addonsTrip > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Add-ons</span>
                    <span className="text-neutral-900">{usd(addonsTrip)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-semibold text-neutral-900">
                  Total
                </span>
                <span className="text-xl font-bold text-neutral-900">
                  {usd(totalTrip)}
                </span>
              </div>

              <Button className="w-full" onClick={goConfirm} size="lg">
                Pagar ahora (demo)
              </Button>

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
