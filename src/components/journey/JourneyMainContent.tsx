'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import BudgetStep from '@/components/journey/BudgetStep';
import ExcuseStep from '@/components/journey/ExcuseStep';
import { JourneyDetailsStep } from '@/components/journey/JourneyDetailsStep';
import type { JourneyDetailsStepLabels } from '@/components/journey/JourneyDetailsStep';
import { DEFAULT_TRANSPORT_ORDER } from '@/components/journey/TransportSelector';
import {
  isCompleteTransportOrderParam,
  normalizeMaxTravelTimeKey,
  normalizeTransportId,
  normalizeJourneyFilterValue,
} from '@/lib/helpers/transport';
import { JourneyPreferencesStep } from '@/components/journey/JourneyPreferencesStep';
import type { JourneyPreferencesStepLabels } from '@/components/journey/JourneyPreferencesStep';
import {
  getLevelById,
} from '@/lib/utils/experiencesData';
import {
  getExcusesByTypeAndLevel,
  getExcuseOptions,
  getHasExcuseStep,
} from '@/lib/helpers/excuse-helper';
import { buildTripRequestPayloadFromSearchParams } from '@/lib/helpers/journey';
import { useQuerySync } from '@/hooks/useQuerySync';
import { useStore } from '@/store/store';
import { useUserStore } from '@/store/slices/userStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { TravelerTypeSlug } from '@/lib/data/traveler-types';
import { JOURNEY_ADDONS_ENABLED } from 'config/journey-features';

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
      router.push(`/${locale}/checkout?tripId=${data.tripRequest.id}`);
    } catch (err) {
      console.error('Error saving trip:', err);
      toast.error('Error de conexión. Intentá de nuevo.');
    } finally {
      setIsSavingAndRedirecting(false);
    }
  }, [locale, router, searchParams, session?.user?.email, sessionStatus]);
  const { filters, setPartial } = useStore();
  const [internalAccordion, setInternalAccordion] = useState<string>('');
  const isControlled =
    openSectionId !== undefined && onOpenSection !== undefined;
  const accordionValue = isControlled
    ? (openSectionId ?? '')
    : internalAccordion;
  const setAccordionValue = isControlled
    ? onOpenSection!
    : setInternalAccordion;

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

  // Auto-open first section when tab changes
  useEffect(() => {
    if (
      activeTab === 'budget' &&
      accordionValue !== 'travel-type' &&
      accordionValue !== 'experience'
    ) {
      setAccordionValue('travel-type');
    } else if (
      activeTab === 'excuse' &&
      accordionValue !== 'excuse' &&
      accordionValue !== 'refine-details'
    ) {
      setAccordionValue('excuse');
    } else if (
      activeTab === 'details' &&
      accordionValue !== 'dates' &&
      accordionValue !== 'origin' &&
      accordionValue !== 'transport'
    ) {
      setAccordionValue('origin');
    } else if (
      activeTab === 'preferences' &&
      accordionValue !== '' &&
      accordionValue !== 'filters' &&
      !(JOURNEY_ADDONS_ENABLED && accordionValue === 'addons')
    ) {
      setAccordionValue('filters');
    }
  }, [activeTab, accordionValue, setAccordionValue]);

  const travelType = useMemo(() => {
    return searchParams.get('travelType') || undefined;
  }, [searchParams]);

  const experience = useMemo(() => {
    return searchParams.get('experience') || undefined;
  }, [searchParams]);

  const excuse = useMemo(() => {
    return searchParams.get('excuse') || undefined;
  }, [searchParams]);

  const refineDetails = useMemo(() => {
    const details = searchParams.get('refineDetails');
    if (!details) return [];
    return details.split(',').filter(Boolean);
  }, [searchParams]);

  const originCountry = useMemo(() => {
    return searchParams.get('originCountry') || '';
  }, [searchParams]);

  const originCity = useMemo(() => {
    return searchParams.get('originCity') || '';
  }, [searchParams]);

  const startDate = useMemo(() => {
    return searchParams.get('startDate') || undefined;
  }, [searchParams]);

  const nights = useMemo(() => {
    const raw = searchParams.get('nights');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);

  const transportOrder = useMemo(() => {
    const raw = searchParams.get('transportOrder');
    if (!raw) return DEFAULT_TRANSPORT_ORDER;
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .map((id) => normalizeTransportId(id))
      .filter((id): id is string => Boolean(id));
    return ids.length === 4 ? ids : DEFAULT_TRANSPORT_ORDER;
  }, [searchParams]);

  const transport = isCompleteTransportOrderParam(
    searchParams.get('transportOrder'),
  )
    ? normalizeTransportId(transportOrder[0])
    : undefined;

  const prevActiveTabRef = useRef(activeTab);
  const [draftOriginCountry, setDraftOriginCountry] = useState('');
  const [draftOriginCity, setDraftOriginCity] = useState('');
  const [draftStartDate, setDraftStartDate] = useState<string | undefined>(
    undefined,
  );
  const [draftNights, setDraftNights] = useState(1);
  const [draftTransportOrder, setDraftTransportOrder] = useState<string[]>(
    DEFAULT_TRANSPORT_ORDER,
  );

  // Sync URL -> draft when entering details step
  useEffect(() => {
    if (activeTab === 'details') {
      setDraftOriginCountry(originCountry);
      setDraftOriginCity(originCity);
      setDraftStartDate(startDate);
      setDraftNights(nights);
      setDraftTransportOrder(transportOrder);
      prevActiveTabRef.current = activeTab;
    }
  }, [activeTab, originCity, originCountry, nights, startDate, transportOrder]);

  // Flush draft -> URL when leaving details step (so searchParams update on next step, not in real time)
  useEffect(() => {
    if (prevActiveTabRef.current === 'details' && activeTab !== 'details') {
      updateQuery({
        nights: String(draftNights),
        originCity: draftOriginCity || undefined,
        originCountry: draftOriginCountry || undefined,
        startDate: draftStartDate ?? undefined,
        transportOrder:
          draftTransportOrder.length === 4
            ? draftTransportOrder.join(',')
            : undefined,
      });
    }
    prevActiveTabRef.current = activeTab;
  }, [
    activeTab,
    draftOriginCity,
    draftOriginCountry,
    draftNights,
    draftStartDate,
    draftTransportOrder,
    updateQuery,
  ]);

  const effectiveOriginCountry =
    activeTab === 'details' ? draftOriginCountry : originCountry;
  const effectiveOriginCity =
    activeTab === 'details' ? draftOriginCity : originCity;
  const effectiveStartDate =
    activeTab === 'details' ? draftStartDate : startDate;
  const effectiveNights = activeTab === 'details' ? draftNights : nights;
  const effectiveTransportOrder =
    activeTab === 'details' ? draftTransportOrder : transportOrder;

  const departPref = useMemo(() => {
    return normalizeJourneyFilterValue(searchParams.get('departPref')) || undefined;
  }, [searchParams]);

  const arrivePref = useMemo(() => {
    return normalizeJourneyFilterValue(searchParams.get('arrivePref')) || undefined;
  }, [searchParams]);

  const maxTravelTime = useMemo(() => {
    return normalizeMaxTravelTimeKey(searchParams.get('maxTravelTime')) || undefined;
  }, [searchParams]);

  const climate = useMemo(() => {
    return normalizeJourneyFilterValue(searchParams.get('climate')) || undefined;
  }, [searchParams]);

  const accommodationType = useMemo(() => {
    return normalizeJourneyFilterValue(searchParams.get('accommodationType')) || undefined;
  }, [searchParams]);

  const [draftDepartPref, setDraftDepartPref] = useState<string>('any');
  const [draftArrivePref, setDraftArrivePref] = useState<string>('any');
  const [draftClimate, setDraftClimate] = useState<string>('any');
  const [draftMaxTravelTime, setDraftMaxTravelTime] =
    useState<string>('no-limit');
  const [draftAccommodationType, setDraftAccommodationType] =
    useState<string>('any');

  // Sync URL -> draft when entering preferences step (so form shows current URL values)
  useEffect(() => {
    if (activeTab === 'preferences') {
      setDraftDepartPref(departPref ?? 'any');
      setDraftArrivePref(arrivePref ?? 'any');
      setDraftClimate(climate ?? 'any');
      setDraftMaxTravelTime(maxTravelTime ?? 'no-limit');
      setDraftAccommodationType(accommodationType ?? 'any');
    }
  }, [
    activeTab,
    accommodationType,
    arrivePref,
    climate,
    departPref,
    maxTravelTime,
  ]);

  const effectiveDepartPref =
    activeTab === 'preferences'
      ? draftDepartPref
      : (departPref ?? 'any');
  const effectiveArrivePref =
    activeTab === 'preferences'
      ? draftArrivePref
      : (arrivePref ?? 'any');
  const effectiveClimate =
    activeTab === 'preferences' ? draftClimate : (climate ?? 'any');
  const effectiveMaxTravelTime =
    activeTab === 'preferences'
      ? draftMaxTravelTime
      : (maxTravelTime ?? 'no-limit');
  const effectiveAccommodationType =
    activeTab === 'preferences'
      ? draftAccommodationType
      : (accommodationType ?? 'any');

  const addons = useMemo(() => {
    return searchParams.get('addons') || undefined;
  }, [searchParams]);

  const selectedExperienceLevel = useMemo(() => {
    if (!travelType || !experience) return null;
    return getLevelById(travelType, experience, locale) ?? null;
  }, [experience, locale, travelType]);

  const excuses = useMemo(() => {
    if (!travelType) return [];
    return getExcusesByTypeAndLevel(travelType, experience);
  }, [travelType, experience]);

  const refineDetailsOptions = useMemo(() => {
    if (!excuse) return [];
    const options = getExcuseOptions(excuse);
    const byType = localizedRefineOptions?.[travelType ?? ''];
    const localized = byType?.[excuse];
    if (!localized?.length) return options;
    return options.map((opt) => {
      const over = localized.find((o) => o.key === opt.key);
      return over ? { ...opt, label: over.label, desc: over.desc } : opt;
    });
  }, [excuse, travelType, localizedRefineOptions]);

  const hasExcuseStep = useMemo(
    () => getHasExcuseStep(travelType ?? '', experience),
    [travelType, experience],
  );

  const paramsToResetAfterTravelType = useMemo(
    () => ({
      accommodationType: undefined,
      addons: undefined as string | undefined,
      arrivePref: undefined,
      climate: undefined,
      departPref: undefined,
      excuse: undefined,
      experience: undefined,
      maxTravelTime: undefined,
      nights: undefined,
      originCity: undefined,
      originCountry: undefined,
      refineDetails: undefined,
      startDate: undefined,
      transportOrder: undefined,
      avoidDestinations: undefined as string | undefined,
    }),
    [],
  );

  const paramsToResetAfterExperience = useMemo(
    () => ({
      accommodationType: undefined,
      addons: undefined as string | undefined,
      arrivePref: undefined,
      avoidDestinations: undefined as string | undefined,
      climate: undefined,
      departPref: undefined,
      excuse: undefined,
      maxTravelTime: undefined,
      nights: undefined,
      originCity: undefined,
      originCountry: undefined,
      refineDetails: undefined,
      startDate: undefined,
      transportOrder: undefined,
    }),
    [],
  );

  const handleTravelTypeSelect = (slug: string) => {
    updateQuery({ ...paramsToResetAfterTravelType, travelType: slug });
    setAccordionValue('experience');
  };

  const handleExperienceSelect = (levelId: string) => {
    updateQuery({ ...paramsToResetAfterExperience, experience: levelId });
    const hasExcuseStepForSelection = getHasExcuseStep(
      travelType ?? '',
      levelId,
    );
    if (onTabChange)
      onTabChange(hasExcuseStepForSelection ? 'excuse' : 'details');
    setAccordionValue(hasExcuseStepForSelection ? 'excuse' : 'origin');
  };

  const handleExcuseSelect = (excuseKey: string) => {
    updateQuery({
      excuse: excuseKey,
      refineDetails: undefined, // Reset refine details when excuse changes
    });
    // Advance to next dropdown
    setAccordionValue('refine-details');
  };

  const handleRefineDetailsSelect = (optionKey: string) => {
    const currentDetails = [...refineDetails];
    const index = currentDetails.indexOf(optionKey);

    if (index > -1) {
      // Remove if already selected
      currentDetails.splice(index, 1);
    } else {
      // Add if not selected
      currentDetails.push(optionKey);
    }

    updateQuery({
      refineDetails:
        currentDetails.length > 0 ? currentDetails.join(',') : undefined,
    });
  };

  const handleOriginCountryChange = (value: string) => {
    if (activeTab === 'details') {
      setDraftOriginCountry(value);
      setDraftOriginCity('');
      setDraftStartDate(undefined);
      setDraftNights(1);
      setDraftTransportOrder(DEFAULT_TRANSPORT_ORDER);
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
      setDraftOriginCity(value);
      setDraftStartDate(undefined);
      setDraftNights(1);
      setDraftTransportOrder(DEFAULT_TRANSPORT_ORDER);
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
      setDraftStartDate(value);
    } else {
      updateQuery({
        startDate: value,
      });
    }
  };

  const handleNightsChange = (value: number) => {
    if (activeTab === 'details') {
      setDraftNights(value);
    } else {
      updateQuery({
        nights: String(value),
      });
    }
  };

  const handleRangeChange = (startDate: string | undefined, nights: number) => {
    if (activeTab === 'details') {
      setDraftStartDate(startDate);
      setDraftNights(nights);
    } else {
      updateQuery({
        nights: String(nights),
        startDate: startDate ?? undefined,
      });
    }
  };

  const handleTransportOrderChange = (orderedIds: string[]) => {
    if (activeTab === 'details') {
      setDraftTransportOrder(orderedIds);
    } else {
      updateQuery({
        transportOrder:
          orderedIds.length === 4 ? orderedIds.join(',') : undefined,
      });
    }
  };

  const handleDepartPrefChange = (value: string) => {
    if (activeTab === 'preferences') setDraftDepartPref(value);
    else updateQuery({ departPref: value });
  };

  const handleArrivePrefChange = (value: string) => {
    if (activeTab === 'preferences') setDraftArrivePref(value);
    else updateQuery({ arrivePref: value });
  };

  const handleMaxTravelTimeChange = (value: string) => {
    if (activeTab === 'preferences') setDraftMaxTravelTime(value);
    else updateQuery({ maxTravelTime: value });
  };

  const handleClimateChange = (value: string) => {
    if (activeTab === 'preferences') setDraftClimate(value);
    else updateQuery({ climate: value });
  };

  const handleAccommodationTypeChange = (value: string) => {
    if (activeTab === 'preferences') setDraftAccommodationType(value);
    else updateQuery({ accommodationType: value });
  };

  const handleSaveFilters = () => {
    updateQuery({
      accommodationType: draftAccommodationType,
      arrivePref: draftArrivePref,
      climate: draftClimate,
      departPref: draftDepartPref,
      maxTravelTime: draftMaxTravelTime,
    });
    setAccordionValue(JOURNEY_ADDONS_ENABLED ? 'addons' : '');
    scrollToActions();
  };

  const handleClearFilters = () => {
    setDraftAccommodationType('any');
    setDraftArrivePref('any');
    setDraftClimate('any');
    setDraftDepartPref('any');
    setDraftMaxTravelTime('no-limit');
    updateQuery({
      accommodationType: 'any',
      arrivePref: 'any',
      avoidDestinations: undefined,
      climate: 'any',
      departPref: 'any',
      maxTravelTime: 'no-limit',
    });
    setPartial({
      filters: {
        ...filters,
        accommodationType: 'any',
        arrivePref: 'any',
        climate: 'any',
        departPref: 'any',
        maxTravelTime: 'no-limit',
      },
    });
  };

  const handleAddonsChange = (value: string | undefined) => {
    updateQuery({ addons: value });
  };

  const getTravelTypeLabel = () => {
    if (!travelType) return labels.travelTypePlaceholder;
    const localized = localizedTravelerTypes?.find((t) => t.key === travelType);
    return localized?.title || travelType;
  };

  const getExperienceLabel = () => {
    if (!experience || !travelType) return labels.experiencePlaceholder;
    const level = getLevelById(travelType, experience, locale);
    return level?.name ?? experience;
  };

  const getExcuseLabel = () => {
    if (!excuse) return labels.excusePlaceholder;
    const selectedExcuseData = excuses.find((e) => e.key === excuse);
    return selectedExcuseData?.title || excuse;
  };

  const getRefineDetailsLabel = () => {
    if (refineDetails.length === 0) return labels.refineDetailsPlaceholder;
    if (refineDetails.length === 1) {
      const option = refineDetailsOptions.find(
        (o) => o.key === refineDetails[0],
      );
      return option?.label || labels.refineDetailsOneSelected;
    }
    return labels.refineDetailsCountSelected.replace(
      '{count}',
      String(refineDetails.length),
    );
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
    });
    setAccordionValue('');
    // Reset to first tab
    if (onTabChange) {
      onTabChange('budget');
    }
  };

  const getNextTab = () => {
    const tabs = hasExcuseStep
      ? ['budget', 'excuse', 'details', 'preferences']
      : ['budget', 'details', 'preferences'];
    const currentIndex = tabs.indexOf(activeTab);
    return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
  };

  const isCurrentStepComplete = () => {
    switch (activeTab) {
      case 'budget':
        return travelType && experience;
      case 'excuse':
        return travelType && experience && (excuse || !hasExcuseStep);
      case 'details':
        return (
          effectiveOriginCountry &&
          effectiveOriginCity &&
          effectiveStartDate &&
          effectiveNights
        );
      case 'preferences':
        return Boolean(transport);
      default:
        return true;
    }
  };

  const isAllStepsComplete = Boolean(
    travelType &&
      experience &&
      (excuse || !hasExcuseStep) &&
      effectiveOriginCountry &&
      effectiveOriginCity &&
      effectiveStartDate &&
      effectiveNights &&
      transport,
  );

  const handleContinue = () => {
    const nextTab = getNextTab();
    if (nextTab && onTabChange) {
      onTabChange(nextTab);
      if (nextTab === 'details') setAccordionValue('origin');
      if (nextTab === 'preferences') setAccordionValue('filters');
      scrollToActions();
    }
  };

  const hasSelections =
    (accommodationType && accommodationType !== 'any') ||
    (JOURNEY_ADDONS_ENABLED && addons) ||
    arrivePref ||
    climate ||
    departPref ||
    experience ||
    excuse ||
    maxTravelTime ||
    effectiveOriginCity ||
    effectiveOriginCountry ||
    refineDetails.length > 0 ||
    effectiveStartDate ||
    transport ||
    travelType;

  const renderContent = () => {
    switch (activeTab) {
      case 'budget':
        return (
          <BudgetStep
            accordionValue={accordionValue}
            experienceContent={getExperienceLabel()}
            fullViewportWidth={false}
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
            selectedExperienceLevel={experience}
            selectedTravelType={travelType as TravelerTypeSlug}
            travelerType={travelType as TravelerTypeSlug}
            travelTypeContent={getTravelTypeLabel()}
          />
        );
      case 'excuse':
        if (!hasExcuseStep) return null;
        return (
          <ExcuseStep
            accordionValue={accordionValue}
            onAccordionValueChange={setAccordionValue}
            onTabChange={onTabChange}
            travelType={travelType as TravelerTypeSlug | undefined}
            experience={experience}
            excuse={excuse}
            hasExcuseStep={hasExcuseStep}
            excuses={excuses}
            localizedExcuses={localizedExcuses}
            onSelectExcuse={handleExcuseSelect}
            refineDetailsOptions={refineDetailsOptions}
            refineDetails={refineDetails}
            onSelectRefineDetails={handleRefineDetailsSelect}
            onClearRefineDetails={handleClearRefineDetails}
            getExcuseLabel={getExcuseLabel()}
            getRefineDetailsLabel={getRefineDetailsLabel()}
            labels={{
              completeBudgetFirst: labels.completeBudgetFirst,
              customTripNoExcuseMessage: labels.customTripNoExcuseMessage,
              excuseCardCta: labels.excuseCardCta,
              excuseLabel: labels.excuseLabel,
              excuseStepDescription: labels.excuseStepDescription,
              next: labels.next,
              refineDetailsLabel: labels.refineDetailsLabel,
              refineDetailsPlaceholder: labels.refineDetailsPlaceholder,
              refineDetailsStepDescription:
                labels.refineDetailsStepDescription,
              clearAll: labels.clearAll,
            }}
          />
        );
      case 'details':
        if (!travelType || !experience || (hasExcuseStep && !excuse)) {
          return (
            <div className="py-12 text-center">
              <p className="text-gray-500">{labels.completeBudgetAndExcuse}</p>
            </div>
          );
        }

        return (
          <JourneyDetailsStep
            experience={experience}
            labels={detailsStepLabels}
            nights={effectiveNights}
            onNightsChange={handleNightsChange}
            onOpenSection={setAccordionValue}
            onOriginCityChange={handleOriginCityChange}
            onOriginCountryChange={handleOriginCountryChange}
            onRangeChange={handleRangeChange}
            onStartDateChange={handleStartDateChange}
            onTransportOrderChange={handleTransportOrderChange}
            openSectionId={accordionValue || 'origin'}
            originCity={effectiveOriginCity}
            originCountry={effectiveOriginCountry}
            startDate={effectiveStartDate}
            transportOrder={effectiveTransportOrder}
            travelType={travelType}
          />
        );
      case 'preferences':
        if (!originCountry || !originCity || !startDate) {
          return (
            <div className="py-12 text-center">
              <p className="text-gray-500">{labels.completeOriginFirst}</p>
            </div>
          );
        }

        return (
          <JourneyPreferencesStep
            accommodationType={effectiveAccommodationType}
            addons={addons}
            addonLabels={addonLabels}
            arrivePref={effectiveArrivePref}
            climate={effectiveClimate}
            departPref={effectiveDepartPref}
            experience={experience}
            labels={preferencesStepLabels}
            maxTravelTime={effectiveMaxTravelTime}
            onAccommodationTypeChange={handleAccommodationTypeChange}
            onAddonsChange={handleAddonsChange}
            onAfterAddonsSave={scrollToActions}
            onArrivePrefChange={handleArrivePrefChange}
            onClearFilters={handleClearFilters}
            onClimateChange={handleClimateChange}
            onDepartPrefChange={handleDepartPrefChange}
            onMaxTravelTimeChange={handleMaxTravelTimeChange}
            onOpenSection={setAccordionValue}
            onSaveFilters={handleSaveFilters}
            openSectionId={accordionValue}
            originCity={originCity}
            originCountry={originCountry}
            transport={transport}
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

  const nextTab = getNextTab();
  const canContinue = isCurrentStepComplete() && nextTab;

  return (
    <div className={cn('flex-1 min-h-0 flex flex-col', className)}>
      <div className="flex-1" id="journey-actions">
        {renderContent()}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-10 mt-8 pt-6 border-t border-gray-200">
        <button
          className="text-gray-900 underline hover:no-underline text-sm font-medium"
          onClick={handleClearAll}
          type="button"
        >
          {labels.clearAll}
        </button>

        {canContinue && (
          <Button
            className="text-sm font-normal normal-case"
            onClick={handleContinue}
            size="md"
            variant="default"
          >
            {labels.next}
          </Button>
        )}

        {isAllStepsComplete && !canContinue && (
          <Button
            className="text-sm font-normal normal-case"
            disabled={isSavingAndRedirecting}
            onClick={handleGoToCheckout}
            size="md"
            variant="default"
          >
            {isSavingAndRedirecting ? 'Guardando...' : labels.viewCheckout}
          </Button>
        )}
      </div>
    </div>
  );
}
