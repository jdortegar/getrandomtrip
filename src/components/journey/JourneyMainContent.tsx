'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import BudgetStep from '@/components/journey/BudgetStep';
import ExcuseStep from '@/components/journey/ExcuseStep';
import { JourneyDetailsStep } from '@/components/journey/JourneyDetailsStep';
import type { JourneyDetailsStepLabels } from '@/components/journey/JourneyDetailsStep';
import { DEFAULT_TRANSPORT_ORDER } from '@/components/journey/TransportSelector';
import { JourneyPreferencesStep } from '@/components/journey/JourneyPreferencesStep';
import type { JourneyPreferencesStepLabels } from '@/components/journey/JourneyPreferencesStep';
import { JourneyActionBar } from '@/components/journey/JourneyActionBar';
import {
  getExcusesByTypeAndLevel,
  getExcuseOptions,
  getHasExcuseStep,
} from '@/lib/helpers/excuse-helper';
import { clearJourneyDraftStorage } from '@/lib/helpers/journeyDraftStorage';
import {
  buildTripRequestPayloadFromSearchParams,
  checkAllComplete,
  getExcuseLabel,
  getExperienceLabel,
  getNextTab,
  getRefineDetailsLabel,
  getTravelTypeLabel,
  isStepComplete,
  PARAMS_TO_RESET_AFTER_EXPERIENCE,
  PARAMS_TO_RESET_AFTER_TRAVEL_TYPE,
} from '@/lib/helpers/journey';
import { useJourneyAccordion } from '@/hooks/useJourneyAccordion';
import { useJourneyDraftDetails } from '@/hooks/useJourneyDraftDetails';
import { useJourneyDraftPreferences } from '@/hooks/useJourneyDraftPreferences';
import { useJourneySearchParams } from '@/hooks/useJourneySearchParams';
import { useQuerySync } from '@/hooks/useQuerySync';
import { useStore } from '@/store/store';
import { useUserStore } from '@/store/slices/userStore';
import { cn } from '@/lib/utils';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';

interface JourneyMainContentLabels {
  clearAll: string;
  completeBudgetAndExcuse: string;
  completeBudgetFirst: string;
  completeOriginFirst: string;
  customTripNoExcuseMessage: string;
  excuseLabel: string;
  excusePlaceholder: string;
  excuseCardCta: string;
  excuseStepDescription: string;
  experienceLabel: string;
  experiencePlaceholder: string;
  experienceStepDescription: string;
  extrasTabDescription: string;
  extrasTabTitle: string;
  next: string;
  refineDetailsLabel: string;
  refineDetailsPlaceholder: string;
  refineDetailsOneSelected: string;
  refineDetailsCountSelected: string;
  refineDetailsStepDescription: string;
  travelTypeLabel: string;
  travelTypePlaceholder: string;
  viewCheckout: string;
  viewSummary?: string;
}

interface JourneyMainContentProps {
  activeTab: string;
  /** Localized addon copy keyed by addon id (journey.addons). */
  addonLabels?: Record<
    string,
    {
      category: string;
      longDescription: string;
      shortDescription: string;
      title: string;
    }
  >;
  className?: string;
  /** Localized excuse titles/descriptions (journey.excuses). */
  localizedExcuses?: Array<{ key: string; title: string; description: string }>;
  /** Localized label/desc for refine-detail options, keyed by travelType then excuse key (journey.refineDetailOptions). */
  localizedRefineOptions?: Record<
    string,
    Record<string, Array<{ key: string; label: string; desc: string }>>
  >;
  /** Localized traveler type labels from dictionary (home.exploration.travelerTypes). */
  localizedTravelerTypes?: Array<{
    description: string;
    key: string;
    title: string;
  }>;
  /** Labels for dropdowns and step copy (journey.mainContent). */
  mainContentLabels: JourneyMainContentLabels;
  /** Labels for details step (journey.detailsStep). */
  detailsStepLabels?: JourneyDetailsStepLabels;
  /** Labels for preferences step (journey.preferencesStep). */
  preferencesStepLabels: JourneyPreferencesStepLabels;
  onOpenSection?: (sectionId: string) => void;
  onTabChange?: (tabId: string) => void;
  openSectionId?: string;
}

export default function JourneyMainContent({
  activeTab,
  addonLabels,
  className,
  detailsStepLabels,
  localizedExcuses,
  localizedRefineOptions,
  localizedTravelerTypes,
  mainContentLabels,
  onOpenSection,
  onTabChange,
  openSectionId,
  preferencesStepLabels,
}: JourneyMainContentProps) {
  const labels = mainContentLabels;
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'es';
  const { data: session, status: sessionStatus } = useSession();
  const [isSavingAndRedirecting, setIsSavingAndRedirecting] = useState(false);
  const updateQuery = useQuerySync();
  const { filters, setPartial } = useStore();

  const url = useJourneySearchParams(searchParams);
  const draftDetails = useJourneyDraftDetails(
    activeTab,
    {
      originCountry: url.originCountry,
      originCity: url.originCity,
      startDate: url.startDate,
      nights: url.nights,
      transportOrder: url.transportOrder,
    },
    updateQuery,
  );
  const draftPrefs = useJourneyDraftPreferences(activeTab, {
    departPref: url.departPref,
    arrivePref: url.arrivePref,
    climate: url.climate,
    maxTravelTime: url.maxTravelTime,
    accommodationType: url.accommodationType,
  });
  const { accordionValue, setAccordionValue } = useJourneyAccordion(
    activeTab,
    openSectionId,
    onOpenSection,
  );

  const hasExcuseStep = useMemo(
    () => getHasExcuseStep(url.travelType ?? '', url.experience),
    [url.travelType, url.experience],
  );

  const excuses = useMemo(() => {
    if (!url.travelType) return [];
    return getExcusesByTypeAndLevel(url.travelType, url.experience);
  }, [url.travelType, url.experience]);

  const refineDetailsOptions = useMemo(() => {
    if (!url.excuse) return [];
    const options = getExcuseOptions(url.excuse);
    const byType = localizedRefineOptions?.[url.travelType ?? ''];
    const localized = byType?.[url.excuse];
    if (!localized?.length) return options;
    return options.map((opt) => {
      const over = localized.find((o) => o.key === opt.key);
      return over ? { ...opt, label: over.label, desc: over.desc } : opt;
    });
  }, [url.excuse, url.travelType, localizedRefineOptions]);

  const stepValues = {
    travelType: url.travelType,
    experience: url.experience,
    excuse: url.excuse,
    refineDetails: url.refineDetails,
    hasExcuseStep,
    effectiveOriginCountry: draftDetails.effectiveOriginCountry,
    effectiveOriginCity: draftDetails.effectiveOriginCity,
    effectiveStartDate: draftDetails.effectiveStartDate,
    effectiveNights: draftDetails.effectiveNights,
    transport: url.transport,
  };

  const scrollToActions = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('journey-actions')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  };

  const handleGoToCheckout = useCallback(async () => {
    const tripPayload = buildTripRequestPayloadFromSearchParams(searchParams);
    const { originCountry, originCity } = tripPayload;
    if (!originCountry || !originCity) {
      toast.error('Completá ciudad y país de origen para continuar.');
      return;
    }
    if (sessionStatus === 'loading') {
      toast.info('Cargando sesión…');
      return;
    }
    if (!session?.user?.email) {
      const { openAuth } = useUserStore.getState();
      openAuth('signin');
      toast.info('Iniciá sesión para continuar al checkout.');
      return;
    }
    setIsSavingAndRedirecting(true);
    try {
      const res = await fetch('/api/trip-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const { openAuth } = useUserStore.getState();
          openAuth('signin');
          toast.info('Iniciá sesión para continuar al checkout.');
        } else {
          toast.error(data.error ?? 'No se pudo guardar el viaje. Intentá de nuevo.');
        }
        return;
      }
      clearJourneyDraftStorage(searchParams.get('draftId'));
      updateQuery({ tripRequestId: data.tripRequest.id });
      router.push(`/${locale}/checkout?tripId=${data.tripRequest.id}`);
    } catch (err) {
      console.error('Error saving trip:', err);
      toast.error('Error de conexión. Intentá de nuevo.');
    } finally {
      setIsSavingAndRedirecting(false);
    }
  }, [locale, router, searchParams, session?.user?.email, sessionStatus, updateQuery]);

  const handleTravelTypeSelect = (slug: string) => {
    updateQuery({ ...PARAMS_TO_RESET_AFTER_TRAVEL_TYPE, travelType: slug });
  };

  const handleExperienceSelect = (levelId: string) => {
    updateQuery({ ...PARAMS_TO_RESET_AFTER_EXPERIENCE, experience: levelId });
  };

  const handleExcuseSelect = (excuseKey: string) => {
    updateQuery({ excuse: excuseKey, refineDetails: undefined });
  };

  const handleRefineDetailsSelect = (optionKey: string) => {
    const currentDetails = [...url.refineDetails];
    const index = currentDetails.indexOf(optionKey);
    if (index > -1) {
      currentDetails.splice(index, 1);
    } else {
      currentDetails.push(optionKey);
    }
    updateQuery({
      refineDetails:
        currentDetails.length > 0 ? currentDetails.join(',') : undefined,
    });
  };

  const handleOriginCountryChange = (value: string) => {
    if (activeTab === 'details') {
      draftDetails.setDraftOriginCountry(value);
      draftDetails.setDraftOriginCity('');
      draftDetails.setDraftStartDate(undefined);
      draftDetails.setDraftNights(1);
      draftDetails.setDraftTransportOrder(DEFAULT_TRANSPORT_ORDER);
      setPartial({ filters: { ...filters, avoidDestinations: [] } });
      updateQuery({ avoidDestinations: undefined });
    } else {
      updateQuery({
        avoidDestinations: undefined,
        nights: undefined,
        originCity: undefined,
        originCountry: value || undefined,
        startDate: undefined,
        transportOrder: undefined,
      });
      setPartial({ filters: { ...filters, avoidDestinations: [] } });
    }
  };

  const handleOriginCityChange = (value: string) => {
    if (activeTab === 'details') {
      draftDetails.setDraftOriginCity(value);
      draftDetails.setDraftStartDate(undefined);
      draftDetails.setDraftNights(1);
      draftDetails.setDraftTransportOrder(DEFAULT_TRANSPORT_ORDER);
      setPartial({ filters: { ...filters, avoidDestinations: [] } });
      updateQuery({ avoidDestinations: undefined });
    } else {
      updateQuery({
        avoidDestinations: undefined,
        nights: undefined,
        originCity: value || undefined,
        startDate: undefined,
        transportOrder: undefined,
      });
      setPartial({ filters: { ...filters, avoidDestinations: [] } });
    }
  };

  const handleStartDateChange = (value: string | undefined) => {
    if (activeTab === 'details') {
      draftDetails.setDraftStartDate(value);
    } else {
      updateQuery({ startDate: value });
    }
  };

  const handleNightsChange = (value: number) => {
    if (activeTab === 'details') {
      draftDetails.setDraftNights(value);
    } else {
      updateQuery({ nights: String(value) });
    }
  };

  const handleRangeChange = (startDate: string | undefined, nights: number) => {
    if (activeTab === 'details') {
      draftDetails.setDraftStartDate(startDate);
      draftDetails.setDraftNights(nights);
    } else {
      updateQuery({ nights: String(nights), startDate: startDate ?? undefined });
    }
  };

  const handleTransportOrderChange = (orderedIds: string[]) => {
    if (activeTab === 'details') {
      draftDetails.setDraftTransportOrder(orderedIds);
    } else {
      updateQuery({
        transportOrder:
          orderedIds.length === 4 ? orderedIds.join(',') : undefined,
      });
    }
  };

  const handleDepartPrefChange = (value: string) => {
    updateQuery({ departPref: value });
  };

  const handleArrivePrefChange = (value: string) => {
    updateQuery({ arrivePref: value });
  };

  const handleMaxTravelTimeChange = (value: string) => {
    updateQuery({ maxTravelTime: value });
  };

  const handleClimateChange = (value: string) => {
    updateQuery({ climate: value });
  };

  const handleAccommodationTypeChange = (value: string) => {
    updateQuery({ accommodationType: value });
  };

  const handleAddonsChange = (value: string | undefined) => {
    updateQuery({ addons: value });
  };

  const handleClearRefineDetails = () => {
    updateQuery({ refineDetails: undefined });
  };

  const handleClearAll = () => {
    updateQuery({
      accommodationType: undefined,
      addons: undefined,
      arrivePref: undefined,
      avoidDestinations: undefined,
      climate: undefined,
      departPref: undefined,
      experience: undefined,
      excuse: undefined,
      maxTravelTime: undefined,
      nights: undefined,
      originCity: undefined,
      originCountry: undefined,
      refineDetails: undefined,
      startDate: undefined,
      transportOrder: undefined,
      travelType: undefined,
      tripRequestId: undefined,
    });
    setAccordionValue('');
    if (onTabChange) onTabChange('budget');
  };

  const handleContinue = () => {
    const nextTab = getNextTab(activeTab, hasExcuseStep);
    if (nextTab && onTabChange) {
      onTabChange(nextTab);
      if (nextTab === 'excuse') setAccordionValue('excuse');
      if (nextTab === 'details') setAccordionValue('origin');
      if (nextTab === 'preferences') setAccordionValue('filters');
      scrollToActions();
    }
  };

  const nextTab = getNextTab(activeTab, hasExcuseStep);
  const canContinue = isStepComplete(activeTab, stepValues) && Boolean(nextTab);
  const isAllStepsComplete = checkAllComplete(stepValues);

  const renderContent = () => {
    switch (activeTab) {
      case 'budget':
        return (
          <BudgetStep
            accordionValue={accordionValue}
            experienceContent={getExperienceLabel(
              url.travelType,
              url.experience,
              locale,
              labels.experiencePlaceholder,
            )}
            handleExperienceSelect={handleExperienceSelect}
            handleTravelTypeSelect={handleTravelTypeSelect}
            labels={{
              experienceLabel: labels.experienceLabel,
              experienceStepDescription: labels.experienceStepDescription,
              travelTypeLabel: labels.travelTypeLabel,
            }}
            locale={locale}
            localizedTravelerTypes={localizedTravelerTypes}
            minimizeAllFeatures
            onAccordionValueChange={setAccordionValue}
            selectedExperienceLevel={url.experience}
            selectedTravelType={url.travelType as TravelerTypeSlug}
            travelerType={url.travelType as TravelerTypeSlug}
            travelTypeContent={getTravelTypeLabel(
              url.travelType,
              localizedTravelerTypes,
              labels.travelTypePlaceholder,
            )}
          />
        );
      case 'excuse':
        if (!hasExcuseStep) return null;
        return (
          <ExcuseStep
            accordionValue={accordionValue}
            onAccordionValueChange={setAccordionValue}
            onTabChange={onTabChange}
            travelType={url.travelType as TravelerTypeSlug | undefined}
            experience={url.experience}
            excuse={url.excuse}
            hasExcuseStep={hasExcuseStep}
            excuses={excuses}
            localizedExcuses={localizedExcuses}
            onSelectExcuse={handleExcuseSelect}
            refineDetailsOptions={refineDetailsOptions}
            refineDetails={url.refineDetails}
            onSelectRefineDetails={handleRefineDetailsSelect}
            onClearRefineDetails={handleClearRefineDetails}
            getExcuseLabel={getExcuseLabel(
              url.excuse,
              excuses,
              labels.excusePlaceholder,
            )}
            getRefineDetailsLabel={getRefineDetailsLabel(
              url.refineDetails,
              refineDetailsOptions,
              labels.refineDetailsOneSelected,
              labels.refineDetailsCountSelected,
              labels.refineDetailsPlaceholder,
            )}
            labels={{
              clearAll: labels.clearAll,
              completeBudgetFirst: labels.completeBudgetFirst,
              customTripNoExcuseMessage: labels.customTripNoExcuseMessage,
              excuseCardCta: labels.excuseCardCta,
              excuseLabel: labels.excuseLabel,
              excuseStepDescription: labels.excuseStepDescription,
              next: labels.next,
              refineDetailsLabel: labels.refineDetailsLabel,
              refineDetailsPlaceholder: labels.refineDetailsPlaceholder,
              refineDetailsStepDescription: labels.refineDetailsStepDescription,
            }}
          />
        );
      case 'details':
        if (!url.travelType || !url.experience || (hasExcuseStep && !url.excuse)) {
          return (
            <div className="py-12 text-center">
              <p className="text-gray-500">{labels.completeBudgetAndExcuse}</p>
            </div>
          );
        }
        return (
          <JourneyDetailsStep
            experience={url.experience}
            labels={detailsStepLabels}
            nights={draftDetails.effectiveNights}
            onNightsChange={handleNightsChange}
            onOpenSection={setAccordionValue}
            onOriginCityChange={handleOriginCityChange}
            onOriginCountryChange={handleOriginCountryChange}
            onRangeChange={handleRangeChange}
            onStartDateChange={handleStartDateChange}
            onTransportOrderChange={handleTransportOrderChange}
            openSectionId={accordionValue || 'origin'}
            originCity={draftDetails.effectiveOriginCity}
            originCountry={draftDetails.effectiveOriginCountry}
            startDate={draftDetails.effectiveStartDate}
            transportOrder={draftDetails.effectiveTransportOrder}
            travelType={url.travelType}
          />
        );
      case 'preferences':
        if (!url.originCountry || !url.originCity || !url.startDate) {
          return (
            <div className="py-12 text-center">
              <p className="text-gray-500">{labels.completeOriginFirst}</p>
            </div>
          );
        }
        return (
          <JourneyPreferencesStep
            accommodationType={draftPrefs.effectiveAccommodationType}
            addons={url.addons}
            addonLabels={addonLabels}
            arrivePref={draftPrefs.effectiveArrivePref}
            climate={draftPrefs.effectiveClimate}
            departPref={draftPrefs.effectiveDepartPref}
            experience={url.experience}
            labels={preferencesStepLabels}
            maxTravelTime={draftPrefs.effectiveMaxTravelTime}
            onAccommodationTypeChange={handleAccommodationTypeChange}
            onAddonsChange={handleAddonsChange}
            onAfterAddonsSave={scrollToActions}
            onArrivePrefChange={handleArrivePrefChange}
            onClimateChange={handleClimateChange}
            onDepartPrefChange={handleDepartPrefChange}
            onMaxTravelTimeChange={handleMaxTravelTimeChange}
            onOpenSection={setAccordionValue}
            openSectionId={accordionValue}
            originCity={url.originCity}
            originCountry={url.originCountry}
            transport={url.transport}
          />
        );
      case 'extras':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {labels.extrasTabTitle}
            </h2>
            <p className="text-gray-600">{labels.extrasTabDescription}</p>
            {/* Placeholder for extras components */}
            Here
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex-1 min-h-0 flex flex-col', className)}>
      <div className="flex-1" id="journey-actions">
        {renderContent()}
      </div>
      <JourneyActionBar
        canContinue={canContinue}
        isAllStepsComplete={isAllStepsComplete}
        isSavingAndRedirecting={isSavingAndRedirecting}
        labels={{
          clearAll: labels.clearAll,
          next: labels.next,
          viewCheckout: labels.viewCheckout,
        }}
        onClearAll={handleClearAll}
        onContinue={handleContinue}
        onGoToCheckout={handleGoToCheckout}
        showClearAll={Boolean(url.travelType)}
      />
    </div>
  );
}
