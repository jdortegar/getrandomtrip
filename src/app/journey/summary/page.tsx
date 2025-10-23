'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

import ChatFab from '@/components/chrome/ChatFab';
import AuthModal from '@/components/auth/AuthModal';

import { useStore } from '@/store/store';
import { useUserStore } from '@/store/slices/userStore';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';

import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';

import Chip from '@/components/badge';
import { Button } from '@/components/ui/button';
import { usePlanData } from '@/hooks/usePlanData';
import { useSaveTrip } from '@/hooks/useSaveTrip';
import { usePayment } from '@/hooks/usePayment';

const usd = (n: number) => `USD ${n.toFixed(2)}`;

function SummaryPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAuthed, authModalOpen, closeAuth } = useUserStore();
  const { saveTrip, isLoading: isSaving, error: saveError } = useSaveTrip();
  const [savedTripId, setSavedTripId] = useState<string | null>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const {
    basePriceUsd,
    displayPrice,
    logistics,
    filters,
    addons,
    level,
    type,
  } = useStore();

  const { tags } = usePlanData();

  // Payment hook with consolidated logic
  const { isProcessing, calculateTotals, initiatePayment } = usePayment({
    basePriceUsd: basePriceUsd || 0,
    logistics,
    filters,
    addons,
  });

  // Define handleSaveTrip before any early returns
  const handleSaveTrip = async () => {
    try {
      console.log('🚀 Attempting to save trip...', { savedTripId, isSaving });
      const trip = await saveTrip(savedTripId || undefined);
      console.log('✅ Trip saved successfully:', trip);
      setSavedTripId(trip.id);
    } catch (error) {
      console.error('❌ Failed to save trip:', error);
    }
  };

  // Open auth modal if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isAuthed) {
      // Open auth modal using the user store
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
    }
  }, [session, isAuthed, status]);

  // Auto-save trip when user arrives (if authenticated)
  useEffect(() => {
    console.log('🔄 Auto-save useEffect triggered:', {
      session: !!session,
      isAuthed,
      savedTripId,
      isSaving,
    });

    if ((session || isAuthed) && !savedTripId && !isSaving) {
      console.log('✅ Conditions met, calling handleSaveTrip');
      handleSaveTrip();
    } else {
      console.log('❌ Conditions not met for auto-save');
    }
  }, [session, isAuthed, savedTripId, isSaving, handleSaveTrip]);

  // Show loading while checking auth
  if (status === 'loading') {
    return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
  }

  // Calculate pricing using consolidated logic (DRY principle)
  const pax = logistics.pax || 1;
  const {
    basePerPax,
    filtersPerPax,
    addonsPerPax,
    cancelInsurancePerPax,
    totalPerPax,
    totalTrip,
  } = calculateTotals();

  // Generate filter chips using FILTER_OPTIONS
  const filterChips: Array<{ key: string; label: string; value: string }> = [];

  // Transport (always shown)
  const transportOption = FILTER_OPTIONS.transport.options.find(
    (opt) => opt.key === filters.transport,
  );
  if (transportOption) {
    filterChips.push({
      key: 'transport',
      label: FILTER_OPTIONS.transport.label,
      value: transportOption.label,
    });
  }

  // Climate
  if (filters.climate !== 'indistinto') {
    const climateOption = FILTER_OPTIONS.climate.options.find(
      (opt) => opt.key === filters.climate,
    );
    if (climateOption) {
      filterChips.push({
        key: 'climate',
        label: FILTER_OPTIONS.climate.label,
        value: climateOption.label,
      });
    }
  }

  // Max Travel Time
  if (filters.maxTravelTime !== 'sin-limite') {
    const maxTravelTimeOption = FILTER_OPTIONS.maxTravelTime.options.find(
      (opt) => opt.key === filters.maxTravelTime,
    );
    if (maxTravelTimeOption) {
      filterChips.push({
        key: 'maxTravelTime',
        label: FILTER_OPTIONS.maxTravelTime.label,
        value: maxTravelTimeOption.label,
      });
    }
  }

  // Depart Preference
  if (filters.departPref !== 'indistinto') {
    const departOption = FILTER_OPTIONS.departPref.options.find(
      (opt) => opt.key === filters.departPref,
    );
    if (departOption) {
      filterChips.push({
        key: 'departPref',
        label: 'Salida',
        value: departOption.label,
      });
    }
  }

  // Arrive Preference
  if (filters.arrivePref !== 'indistinto') {
    const arriveOption = FILTER_OPTIONS.arrivePref.options.find(
      (opt) => opt.key === filters.arrivePref,
    );
    if (arriveOption) {
      filterChips.push({
        key: 'arrivePref',
        label: 'Llegada',
        value: arriveOption.label,
      });
    }
  }

  // Avoid Destinations
  (filters.avoidDestinations || []).forEach((dest) => {
    filterChips.push({
      key: `avoid-${dest}`,
      label: 'Evitar',
      value: dest,
    });
  });

  // Generate addon rows with per-person pricing
  const addonRows = addons.selected
    .map((s) => {
      const a = ADDONS.find((x) => x.id === s.id);
      if (!a) return null;
      const qty = s.qty || 1;

      let pricePerPax = 0;

      if (a.id === 'cancel-ins') {
        // Special case: cancellation insurance is 15% of subtotal
        pricePerPax = cancelInsurancePerPax;
      } else {
        const totalPrice = a.price * qty;

        if (a.type === 'perPax') {
          // For perPax addons, divide by quantity (which usually matches pax)
          pricePerPax = totalPrice / qty;
        } else {
          // For perTrip addons, divide by number of passengers
          pricePerPax = totalPrice / pax;
        }
      }

      return {
        id: s.id,
        title: qty > 1 ? `${a.title} ×${qty}` : a.title,
        pricePerPax,
        type: a.type,
      };
    })
    .filter(Boolean) as {
    id: string;
    title: string;
    pricePerPax: number;
    type: 'perPax' | 'perTrip';
  }[];

  // Totals are already calculated by the payment hook (DRY principle)

  // Build URL with params
  const buildUrlWithParams = (path: string) => {
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('level', level);
    if (basePriceUsd > 0) {
      params.set('pbp', basePriceUsd.toString());
    }
    return `${path}?${params.toString()}`;
  };

  const backToConfig = () =>
    router.push(buildUrlWithParams('/journey/basic-config'));

  const payNow = async () => {
    console.log('💳 PayNow called with savedTripId:', savedTripId);

    // Update trip status to PENDING_PAYMENT before payment
    if (savedTripId) {
      try {
        console.log('🔄 Updating trip before payment...');
        await saveTrip(savedTripId);
        console.log('✅ Trip updated successfully');
      } catch (error) {
        console.error('❌ Failed to update trip:', error);
      }
    } else {
      console.log('⚠️ No savedTripId - trip may not be saved yet');
    }

    // Initiate MercadoPago payment directly
    console.log('🚀 Initiating payment with tripId:', savedTripId || undefined);
    await initiatePayment(savedTripId || undefined);
  };

  const ItemBlock = ({ title, value }: { title: string; value: string }) => (
    <div className="text-neutral-600 text-sm  flex flex-col px-2 py-1">
      <span className="font-medium text-neutral-900 uppercase">{title}</span>
      <p className="font-bold text-neutral-900 text-xl">{value}</p>
    </div>
  );

  return (
    <>
      <Hero
        content={{
          title: 'Resumen del viaje',
          subtitle: 'Revisa tu viaje y confirma los detalles',
          scrollText: '',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
          tags,
        }}
        className="!h-[40vh]"
        scrollIndicator={false}
      />
      <Section>
        {/* <Navbar /> */}
        {/* <div id="hero-sentinel" aria-hidden className="h-px w-px" /> */}
        {/* <BgCarousel scrim={0.65} /> */}

        <div className="flex gap-6 w-full font-jost">
          {/* Columna izquierda */}
          <div className="flex-1 space-y-4">
            <div className="bg-gray-100 p-6 rounded-md border border-gray-200">
              <h2 className="text-xl font-semibold text-neutral-900 mb-8">
                Logística de tu viaje
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-jost">
                <ItemBlock
                  title="País de Salida"
                  value={logistics.country ?? '—'}
                />
                <ItemBlock
                  title="Ciudad de Salida"
                  value={logistics.city ?? '—'}
                />
                <ItemBlock
                  title="Fecha de inicio"
                  value={
                    logistics.startDate
                      ? new Date(logistics.startDate).toLocaleDateString()
                      : '—'
                  }
                />
                <ItemBlock
                  title="Fecha de fin"
                  value={
                    logistics.endDate
                      ? new Date(logistics.endDate).toLocaleDateString()
                      : '—'
                  }
                />
                <ItemBlock
                  title="Noches"
                  value={
                    logistics.nights > 0 ? logistics.nights.toString() : '—'
                  }
                />
                <ItemBlock title="Viajeros" value={pax.toString()} />
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-md border border-gray-200">
              <h2 className="text-base font-semibold text-neutral-900 mb-3">
                Filtros y Preferencias
              </h2>
              <div className="flex flex-wrap gap-2">
                {filterChips.length ? (
                  filterChips.map((chip) => (
                    <Chip
                      key={chip.key}
                      item={{
                        key: chip.key,
                        label: chip.label,
                        value: chip.value,
                      }}
                      color="primary"
                      size="md"
                    />
                  ))
                ) : (
                  <span className="text-sm text-neutral-600">
                    Sin filtros adicionales.
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-md border border-gray-200">
              <h2 className="text-base font-semibold text-neutral-900 mb-3">
                Tus add-ons ({addonRows.length})
              </h2>
              <div className="divide-y divide-neutral-200">
                {addonRows.length ? (
                  addonRows.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="font-medium text-neutral-900">
                        {r.title}
                      </div>
                      <div className="text-sm font-medium text-neutral-900">
                        {usd(r.pricePerPax)}{' '}
                        {r.type === 'perPax' ? 'per pasajero' : 'por viaje'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-700 py-2">
                    No agregaste add-ons.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <aside className="sticky top-20 self-start w-80 flex-shrink-0 max-w-[300px]">
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-neutral-900">
                  Precio
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">Base por persona</span>
                  <span className="font-medium text-neutral-900">
                    {displayPrice || usd(basePerPax)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">
                    Filtros premium ({filterChips.length})
                  </span>
                  <span className="font-medium text-neutral-900">
                    {usd(filtersPerPax)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">
                    Add-ons ({addonRows.length})
                  </span>
                  <span className="font-medium text-neutral-900">
                    {usd(addonsPerPax + cancelInsurancePerPax)}
                  </span>
                </div>

                <div className="h-px bg-neutral-200 my-1" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">
                    Total por persona ({pax})
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {usd(totalPerPax)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">Total (x{pax})</span>
                  <span className="font-semibold text-neutral-900">
                    {usd(totalTrip)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button asChild variant="secondary" className="w-full">
                  <Link href={buildUrlWithParams('/journey/basic-config')}>
                    ← Volver a editar
                  </Link>
                </Button>

                <Button
                  onClick={
                    !session && !isAuthed
                      ? () => {
                          const { openAuth } = useUserStore.getState();
                          openAuth('signin');
                        }
                      : payNow
                  }
                  disabled={isProcessing || isSaving}
                  className="w-full"
                >
                  {isProcessing || isSaving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando pago...
                    </div>
                  ) : !session && !isAuthed ? (
                    'Inicia sesión para continuar'
                  ) : (
                    'Continuar a pago'
                  )}
                </Button>
              </div>
            </div>
          </aside>
        </div>

        <ChatFab />
      </Section>

      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuth}
        defaultMode="login"
      />
    </>
  );
}

export default function SummaryPage() {
  return (
    <Suspense
      fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}
    >
      <SummaryPageContent />
    </Suspense>
  );
}
