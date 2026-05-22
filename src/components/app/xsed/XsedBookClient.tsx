'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { getNextWeekend, toISODate } from '@/lib/helpers/xsed-dates';
import { Minus, Plus } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import HeaderHero from '@/components/journey/HeaderHero';
import { JourneyActionBar } from '@/components/journey/JourneyActionBar';
import JourneyContentNavigation from '@/components/journey/JourneyContentNavigation';
import JourneyProgressSidebar from '@/components/journey/JourneyProgressSidebar';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import CountrySelector from '@/components/journey/CountrySelector';
import CitySelector from '@/components/journey/CitySelector';
import { XsedSummary } from '@/components/app/xsed/XsedSummary';
import { useUserStore } from '@/store/slices/userStore';
import type { JourneyDetailsStepLabels } from '@/components/journey/JourneyDetailsStep';
import type { JourneyUserBadgeLabels } from '@/components/journey/JourneyUserBadge';

// ─── Constants ────────────────────────────────────────────────────────────────

const XSED_ACTION_BAR_LABELS = {
  clearAll: 'Limpiar todo',
  next: 'Siguiente',
  viewCheckout: 'COMPRAR XSED',
};

const XSED_SIDEBAR_TABS = [
  {
    id: 'details',
    label: 'Origen',
    substeps: [
      {
        id: 'origin',
        title: 'País y ciudad de salida',
        description: 'Desde dónde arrancás tu escape',
      },
      {
        id: 'pax',
        title: 'Pasajeros',
        description: 'Cantidad de personas',
      },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface XsedBookClientProps {
  detailsStepLabels?: JourneyDetailsStepLabels;
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function XsedBookClient({ detailsStepLabels, locale, userBadgeLabels }: XsedBookClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const [originCountry, setOriginCountry] = useState(
    searchParams.get('originCountry') ?? '',
  );
  const [originCity, setOriginCity] = useState(
    searchParams.get('originCity') ?? '',
  );
  const [pax, setPax] = useState(2);
  const [activeTab, setActiveTab] = useState('details');
  const [openSection, setOpenSection] = useState('origin');
  const [isSaving, setIsSaving] = useState(false);

  const { saturday, sunday } = useMemo(() => getNextWeekend(), []);

  const handleTabChange = (tabId: string) => setActiveTab(tabId);

  const handleStepClick = (tabId: string, substepId?: string) => {
    setActiveTab(tabId);
    if (substepId) setOpenSection(substepId);
  };

  const handleSummaryEdit = (sectionId: string) => {
    setActiveTab('details');
    setOpenSection(sectionId);
  };

  const handleOriginCountryChange = (value: string) => {
    setOriginCountry(value);
    setOriginCity('');
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set('originCountry', value);
    else next.delete('originCountry');
    next.delete('originCity');
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const handleOriginCityChange = (value: string) => {
    setOriginCity(value);
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set('originCity', value);
    else next.delete('originCity');
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const canBook = Boolean(originCountry && originCity);
  const isAllStepsComplete = canBook;
  const canContinue = Boolean(originCountry && originCity) && openSection === 'origin';
  const showClearAll = Boolean(originCountry || originCity || pax !== 2);

  const handleContinue = () => {
    setOpenSection('pax');
  };

  const handleClearAll = () => {
    setOriginCountry('');
    setOriginCity('');
    setPax(2);
    setOpenSection('origin');
    router.replace('?', { scroll: false });
  };

  const handleBook = useCallback(async () => {
    if (!originCountry || !originCity) {
      toast.error('Completá país y ciudad de salida para continuar.');
      return;
    }
    if (sessionStatus === 'loading') {
      toast.info('Cargando sesión…');
      return;
    }
    if (!session?.user?.email) {
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
      toast.info('Iniciá sesión para continuar.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/trip-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'xsed',
          level: 'xsed',
          originCountry,
          originCity,
          pax,
          startDate: toISODate(saturday),
          endDate: toISODate(sunday),
          nights: 1,
          status: 'SAVED',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const { openAuth } = useUserStore.getState();
          openAuth('signin');
          toast.info('Iniciá sesión para continuar.');
        } else {
          toast.error(data.error ?? 'No se pudo guardar. Intentá de nuevo.');
        }
        return;
      }
      router.push(`/${locale}/checkout?tripId=${data.tripRequest.id}`);
    } catch {
      toast.error('Error de conexión. Intentá de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }, [originCity, originCountry, pax, locale, router, session, sessionStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHero
        description="Completá tu información de salida para confirmar tu XSED."
        eyebrowColor="#D97E4A"
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle="RESERVÁ TU ESCAPE"
        title="XSED"
        videoSrc="/videos/hero-video-1.mp4"
      />

      <JourneyContentNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={XSED_SIDEBAR_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
        userBadgeLabels={userBadgeLabels}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row w-full gap-8">
          {/* Progress sidebar */}
          <div className="lg:sticky lg:top-8 lg:self-start hidden lg:block">
            <JourneyProgressSidebar
              activeTab={activeTab}
              addonsComingSoonLabel=""
              onStepClick={handleStepClick}
              tabs={XSED_SIDEBAR_TABS}
            />
          </div>

          {/* Main form */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex-1">
            <Accordion
              collapsible
              onValueChange={setOpenSection}
              type="single"
              value={openSection}
            >
              <div className="space-y-4">
                <JourneyDropdown
                  content={
                    originCountry && originCity
                      ? `${originCountry} · ${originCity}`
                      : originCountry || (detailsStepLabels?.originPlaceholder ?? 'Elegí país y ciudad de salida')
                  }
                  label={detailsStepLabels?.originLabel ?? 'Origen'}
                  value="origin"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-base font-bold text-gray-700">
                        {detailsStepLabels?.countryLabel ?? 'País de salida'}
                      </label>
                      <CountrySelector
                        onChange={handleOriginCountryChange}
                        placeholder={detailsStepLabels?.countryPlaceholder ?? 'Escribir país de salida'}
                        size="lg"
                        value={originCountry}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-base font-bold text-gray-700">
                        {detailsStepLabels?.cityLabel ?? 'Ciudad de salida'}
                      </label>
                      <CitySelector
                        countryValue={originCountry}
                        onChange={handleOriginCityChange}
                        placeholder={detailsStepLabels?.cityPlaceholder ?? 'Escribir ciudad de salida'}
                        size="lg"
                        value={originCity}
                      />
                    </div>
                  </div>
                </JourneyDropdown>

                <JourneyDropdown
                  content={`${pax} persona${pax !== 1 ? 's' : ''}`}
                  label="Personas"
                  value="pax"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      className="w-10 h-10 rounded-sm border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      disabled={pax <= 1}
                      onClick={() => setPax((p) => Math.max(1, p - 1))}
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-2xl font-bold w-8 text-center tabular-nums">
                      {pax}
                    </span>
                    <button
                      className="w-10 h-10 rounded-sm border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setPax((p) => p + 1)}
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </JourneyDropdown>
              </div>
            </Accordion>
            <JourneyActionBar
              canContinue={canContinue}
              isAllStepsComplete={isAllStepsComplete}
              isSavingAndRedirecting={isSaving}
              labels={XSED_ACTION_BAR_LABELS}
              onClearAll={handleClearAll}
              onContinue={handleContinue}
              onGoToCheckout={handleBook}
              showClearAll={showClearAll}
            />
            </div>

            
          </div>

          {/* Order summary */}
          <XsedSummary
            onEdit={handleSummaryEdit}
            originCity={originCity}
            originCountry={originCountry}
            pax={pax}
          />
        </div>
      </div>
    </div>
  );
}
