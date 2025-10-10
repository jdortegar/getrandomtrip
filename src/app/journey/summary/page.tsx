'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';

import ChatFab from '@/components/chrome/ChatFab';

import { useStore } from '@/store/store';
import { ADDONS } from '@/data/addons-catalog';
import { FILTER_OPTIONS } from '@/store/slices/journeyStore';
import {
  computeAddonsCostPerTrip,
  computeFiltersCostPerTrip,
} from '@/lib/pricing';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import { getTravelerTypeLabel, getLevelLabel } from '@/lib/data/journey-labels';
import Chip from '@/components/badge';
import { Button } from '@/components/ui/button';
import { usePlanData } from '@/hooks/usePlanData';
import { useSaveTrip } from '@/hooks/useSaveTrip';
import { useUserStore } from '@/store/slices/userStore';

const usd = (n: number) => `USD ${n.toFixed(2)}`;

function SummaryPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAuthed } = useUserStore();
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isAuthed) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?returnTo=${encodeURIComponent(currentPath)}`);
    }
  }, [session, isAuthed, status, router]);

  // Auto-save trip when user arrives (if authenticated)
  useEffect(() => {
    if ((session || isAuthed) && !savedTripId && !isSaving) {
      handleSaveTrip();
    }
  }, [session, isAuthed]);

  const handleSaveTrip = async () => {
    try {
      const trip = await saveTrip(savedTripId || undefined);
      setSavedTripId(trip.id);
    } catch (error) {
      console.error('Failed to save trip:', error);
    }
  };

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

  // Calculate pricing (after auth check)
  const pax = logistics.pax || 1;
  const basePerPax = basePriceUsd || 0;

  const filtersTrip = computeFiltersCostPerTrip(filters, pax);
  const { totalTrip: addonsTrip, cancelCost } = computeAddonsCostPerTrip(
    addons.selected,
    basePerPax,
    filtersTrip,
    pax,
  );

  const filtersPerPax = filtersTrip / pax || 0;

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

  const addonRows = addons.selected
    .map((s) => {
      const a = ADDONS.find((x) => x.id === s.id);
      if (!a) return null;
      const delta = a.options?.find((o) => o.id === s.optionId)?.deltaUsd ?? 0;
      const unitPrice = a.priceUsd + delta;
      const qty = s.qty || 1;
      const lineTotal =
        a.unit === 'per_pax'
          ? unitPrice * pax * qty
          : a.unit === 'per_trip'
            ? unitPrice * qty
            : 0;

      return {
        id: s.id,
        title:
          a.title +
          (s.optionId
            ? ` · ${a.options?.find((o) => o.id === s.optionId)?.label}`
            : ''),
        total: lineTotal,
      };
    })
    .filter(Boolean) as { id: string; title: string; total: number }[];

  // Calculate addonsPerPax based on individual addon rows to match the display
  const addonsPerPax =
    (addonRows.reduce((sum, row) => sum + row.total, 0) + cancelCost) / pax ||
    0;
  const totalPerPax = basePerPax + filtersPerPax + addonsPerPax;
  const totalTrip = totalPerPax * pax;

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
    // Update trip status to PENDING_PAYMENT before checkout
    if (savedTripId) {
      try {
        await saveTrip(savedTripId);
      } catch (error) {
        console.error('Failed to update trip:', error);
      }
    }
    router.push('/journey/checkout');
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
                Tus add-ons ({addonRows.length + (cancelCost > 0 ? 1 : 0)})
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
                        {usd(r.total)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-700 py-2">
                    No agregaste add-ons.
                  </div>
                )}
                {/* {cancelCost > 0 && (
                  <div className="flex items-center justify-between py-3 bg-amber-50 px-3 rounded-lg mt-2">
                    <div className="text-neutral-900 font-medium">
                      Seguro de cancelación · 15% del subtotal
                    </div>
                    <div className="text-sm font-medium text-neutral-900">
                      {usd(cancelCost)}
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <aside className="sticky top-20 self-start w-80 flex-shrink-0">
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-neutral-900">
                  Precio
                </h3>
                {savedTripId && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Guardado
                  </div>
                )}
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
                    Add-ons ({addonRows.length + (cancelCost > 0 ? 1 : 0)})
                  </span>
                  <span className="font-medium text-neutral-900">
                    {usd(addonsPerPax)}
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

                <Button onClick={payNow} className="w-full">
                  Continuar a pago
                </Button>
              </div>
            </div>
          </aside>
        </div>

        <ChatFab />
      </Section>
    </>
  );
}

export default function SummaryPage() {
  return (
    <Suspense
      fallback={
        <>
          <Hero
            content={{
              title: 'Cargando...',
              subtitle: '',
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
      <SummaryPageContent />
    </Suspense>
  );
}
