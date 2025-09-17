'use client';

import Navbar from '@/components/Navbar';
import ChatFab from '@/components/chrome/ChatFab';
import BgCarousel from '@/components/media/BgCarousel';
import GlassCard from '@/components/ui/GlassCard';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { computeAddonsCostPerTrip, computeFiltersCostPerTrip } from '@/lib/pricing';

export default function CheckoutPage() {
  const router = useRouter();
  const { basePriceUsd, logistics, filters, addons } = useStore();
  const pax = logistics.pax || 1;

  const filtersTrip = computeFiltersCostPerTrip(filters, pax);
  const { totalTrip: addonsTrip } = computeAddonsCostPerTrip(addons.selected, basePriceUsd, filtersTrip, pax);
  const total = (basePriceUsd + filtersTrip / pax + addonsTrip / pax) * pax;

  const goConfirm = () => router.push('/journey/confirmation');

  return (
    <>
      <Navbar />
      <div id="hero-sentinel" aria-hidden className="h-px w-px" />
      <BgCarousel scrim={0.65} />
      <main className="container mx-auto px-4 pt-24 md:pt-28 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="space-y-4">
          <GlassCard>
            <div className="p-5">
              <h1 className="text-lg font-semibold text-neutral-900 mb-3">Pasarela de pago</h1>
              <p className="text-sm text-neutral-700">
                Elegí un método. Todos son <strong>demo</strong> por ahora.
              </p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Mercado Pago', 'PayPal', 'Apple Pay', 'Stripe'].map((brand) => (
                  <button
                    key={brand}
                    onClick={goConfirm}
                    className="rounded-xl border border-neutral-300 bg-white py-4 text-neutral-900 hover:bg-neutral-50"
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        <aside>
          <GlassCard>
            <div className="p-5 space-y-3">
              <h2 className="text-base font-semibold text-neutral-900">Resumen</h2>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-700">Total</span>
                <span className="font-semibold text-neutral-900">USD {total.toFixed(2)}</span>
              </div>
              <button
                onClick={goConfirm}
                className="w-full rounded-xl bg-violet-600 text-white py-2.5 font-medium hover:bg-violet-500"
              >
                Pagar ahora (demo)
              </button>
            </div>
          </GlassCard>
        </aside>
      </main>
      <ChatFab />
    </>
  );
}