"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import BudgetStep from "@/components/journey/BudgetStep";
import ExcuseStep from "@/components/journey/ExcuseStep";
import { JourneyDetailsStep } from "@/components/journey/JourneyDetailsStep";
import type { JourneyDetailsStepLabels } from "@/components/journey/JourneyDetailsStep";
import { DEFAULT_TRANSPORT_ORDER } from "@/components/journey/TransportSelector";
import { JourneyPreferencesStep } from "@/components/journey/JourneyPreferencesStep";
import type { JourneyPreferencesStepLabels } from "@/components/journey/JourneyPreferencesStep";
import { JourneyActionBar } from "@/components/journey/JourneyActionBar";
import {
  getExcusesByTypeAndLevel,
  getExcuseOptions,
  getHasExcuseStep,
} from "@/lib/helpers/excuse-helper";
import { clearJourneyDraftStorage } from "@/lib/helpers/journeyDraftStorage";
import {
  buildTripRequestPayloadFromSearchParams,
  getExcuseLabel,
  getExperienceLabel,
  getNextTab,
  getPreviousTab,
  getRefineDetailsLabel,
  getTabSubstepOrder,
  getTravelTypeLabel,
  getTravelTypeSelectionEffects,
  isStepComplete,
  isSubstepValueComplete,
  PARAMS_TO_RESET_AFTER_EXPERIENCE,
  type SubstepCompletionContext,
} from "@/lib/helpers/journey";
import { JOURNEY_ADDONS_ENABLED } from "config/journey-features";
import {
  getDefaultPaxDetailsForTravelType,
  hasPaxSubstep,
} from "@/lib/helpers/pax-details";
import { useJourneyAccordion } from "@/hooks/useJourneyAccordion";
import { useJourneyDraftDetails } from "@/hooks/useJourneyDraftDetails";
import {
  useJourneyDetailsProgressCallback,
  type JourneyDetailsProgress,
} from "@/hooks/useJourneyDetailsProgress";
import { useJourneyDraftPreferences } from "@/hooks/useJourneyDraftPreferences";
import { useJourneySearchParams } from "@/hooks/useJourneySearchParams";
import { useQuerySync } from "@/hooks/useQuerySync";
import { useStore } from "@/store/store";
import { useUserStore } from "@/store/slices/userStore";
import { cn } from "@/lib/utils";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";

interface JourneyMainContentLabels {
  back: string;
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
  selectTravelTypeFirst: string;
  noTripperExperiences: string;
  noLevelsAvailable: string;
  browseGeneralExperiences: string;
  extrasTabDescription: string;
  extrasTabTitle: string;
  next: string;
  processingCheckout: string;
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
  /**
   * When defined (curated journey), only these travel type keys are shown.
   * When undefined, all types are shown (direct journey — current behavior).
   */
  allowedTypes?: string[];
  /**
   * When defined (curated journey), maps each type key to the allowed level ids.
   * Threaded into BudgetStep to filter level cards after type selection.
   * When undefined, all levels are shown.
   */
  allowedLevelsByType?: Record<string, string[]>;
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
  /**
   * Fires whenever the live, draft-aware completion of the "details" tab's
   * Origin/Dates/Transport substeps (and the tab itself) changes. The
   * sidebar (JourneyProgressSidebar) renders as a sibling, not a child, so
   * it can't read this component's draft state directly — the parent page
   * relays this into the sidebar's completion-override props instead.
   */
  onDetailsProgressChange?: (progress: JourneyDetailsProgress) => void;
  onOpenSection?: (sectionId: string) => void;
  onTabChange?: (tabId: string) => void;
  openSectionId?: string;
  /** Tripper branding info — when defined, shown on trip type cards (curated journey). */
  tripperBadge?: { name: string; avatarUrl: string | null };
  /**
   * Tripper slug from the URL (?tripper=<slug>). When defined, included in the
   * POST /api/trip-requests body so the server can resolve and persist tripperId.
   */
  tripperSlug?: string;
}

export default function JourneyMainContent({
  activeTab,
  addonLabels,
  allowedTypes,
  allowedLevelsByType,
  className,
  detailsStepLabels,
  localizedExcuses,
  localizedRefineOptions,
  localizedTravelerTypes,
  mainContentLabels,
  onDetailsProgressChange,
  onOpenSection,
  onTabChange,
  openSectionId,
  preferencesStepLabels,
  tripperBadge,
  tripperSlug,
}: JourneyMainContentProps) {
  const labels = mainContentLabels;
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? "es";
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
    () => getHasExcuseStep(url.travelType ?? "", url.experience),
    [url.travelType, url.experience],
  );

  const excuses = useMemo(() => {
    if (!url.travelType) return [];
    return getExcusesByTypeAndLevel(url.travelType, url.experience);
  }, [url.travelType, url.experience]);

  const refineDetailsOptions = useMemo(() => {
    if (!url.excuse) return [];
    const options = getExcuseOptions(url.excuse);
    const byType = localizedRefineOptions?.[url.travelType ?? ""];
    const localized = byType?.[url.excuse];
    if (!localized?.length) return options;
    return options.map((opt) => {
      const over = localized.find((o) => o.key === opt.key);
      return over ? { ...opt, label: over.label, desc: over.desc } : opt;
    });
  }, [url.excuse, url.travelType, localizedRefineOptions]);

  // Defensive fallback for the "Travellers" substep: paxAdults/paxMinors/paxPets
  // are normally seeded into the URL the moment a group/family/paws travel
  // type is selected (see handleTravelTypeSelect), but this also covers
  // stale/shared links from before this param existed.
  const paxDefaults = useMemo(
    () => getDefaultPaxDetailsForTravelType(url.travelType ?? ""),
    [url.travelType],
  );
  const effectivePaxAdults = url.paxAdults ?? paxDefaults.adults;
  const effectivePaxMinors = url.paxMinors ?? paxDefaults.minors;
  const effectivePaxPets = url.paxPets ?? paxDefaults.pets ?? 0;

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

  // Live, draft-aware "details" tab progress — relayed up to journey/page.tsx
  // so it can override JourneyProgressSidebar's search-param-based checks
  // (which lag behind Origin/Dates/Transport edits until the draft flushes;
  // see useJourneyDetailsProgress.ts for the full rationale). "complete"
  // mirrors isStepComplete("details", ...)'s own criteria (origin + dates
  // only — transport isn't required there, same as JourneyProgressSidebar's
  // isTabComplete("details")).
  useJourneyDetailsProgressCallback(
    {
      origin: Boolean(
        draftDetails.effectiveOriginCountry && draftDetails.effectiveOriginCity,
      ),
      dates: Boolean(
        draftDetails.effectiveStartDate && draftDetails.effectiveNights,
      ),
      transport: draftDetails.effectiveTransportOrder.length === 4,
      complete: isStepComplete("details", stepValues),
    },
    onDetailsProgressChange,
  );

  const scrollToActions = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("journey-actions")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  };

  const handleGoToCheckout = useCallback(async () => {
    const tripPayload = {
      ...buildTripRequestPayloadFromSearchParams(searchParams),
      status: "SAVED",
      ...(tripperSlug ? { tripper: tripperSlug } : {}),
    };
    const { originCountry, originCity } = tripPayload;
    if (!originCountry || !originCity) {
      toast.error("Completá ciudad y país de origen para continuar.");
      return;
    }
    if (sessionStatus === "loading") {
      toast.info("Cargando sesión…");
      return;
    }
    if (!session?.user?.email) {
      const { openAuth } = useUserStore.getState();
      openAuth("signin");
      toast.info("Iniciá sesión para continuar al checkout.");
      return;
    }
    setIsSavingAndRedirecting(true);
    try {
      const res = await fetch("/api/trip-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const { openAuth } = useUserStore.getState();
          openAuth("signin");
          toast.info("Iniciá sesión para continuar al checkout.");
        } else {
          toast.error(
            data.error ?? "No se pudo guardar el viaje. Intentá de nuevo.",
          );
        }
        setIsSavingAndRedirecting(false);
        return;
      }
      clearJourneyDraftStorage(searchParams.get("draftId"));
      updateQuery({ tripRequestId: data.tripRequest.id });
      router.push(`/${locale}/checkout?tripId=${data.tripRequest.id}`);
    } catch (err) {
      console.error("Error saving trip:", err);
      toast.error("Error de conexión. Intentá de nuevo.");
      setIsSavingAndRedirecting(false);
    }
  }, [
    locale,
    router,
    searchParams,
    session?.user?.email,
    sessionStatus,
    tripperSlug,
    updateQuery,
  ]);

  const handleTravelTypeSelect = (slug: string) => {
    // For group/family/paws we also seed paxAdults/paxMinors/paxPets to that
    // type's sensible defaults, so switching travel types never carries over
    // stale numbers from a previous type.
    const paxSeed = hasPaxSubstep(slug)
      ? getDefaultPaxDetailsForTravelType(slug)
      : null;
    const { queryPatch, accordionValue: nextAccordionValue } =
      getTravelTypeSelectionEffects(slug, paxSeed);
    updateQuery(queryPatch);
    // The accordion is a single flat piece of state shared across the whole
    // flow (see useJourneyAccordion) — "dates"/"transport" stay *valid*
    // accordion values for the "details" tab's own whitelist even though
    // origin/dates/transport were just wiped above, so it must be reset
    // explicitly here (matching the "origin" target handleContinue already
    // uses when advancing into "details" normally).
    setAccordionValue(nextAccordionValue);
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
        currentDetails.length > 0 ? currentDetails.join(",") : undefined,
    });
  };

  const handleOriginCountryChange = (value: string) => {
    if (activeTab === "details") {
      draftDetails.setDraftOriginCountry(value);
      draftDetails.setDraftOriginCity("");
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
    if (activeTab === "details") {
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
    if (activeTab === "details") {
      draftDetails.setDraftStartDate(value);
    } else {
      updateQuery({ startDate: value });
    }
  };

  const handleNightsChange = (value: number) => {
    if (activeTab === "details") {
      draftDetails.setDraftNights(value);
    } else {
      updateQuery({ nights: String(value) });
    }
  };

  const handleRangeChange = (startDate: string | undefined, nights: number) => {
    if (activeTab === "details") {
      draftDetails.setDraftStartDate(startDate);
      draftDetails.setDraftNights(nights);
    } else {
      updateQuery({
        nights: String(nights),
        startDate: startDate ?? undefined,
      });
    }
  };

  const handleTransportOrderChange = (orderedIds: string[]) => {
    if (activeTab === "details") {
      draftDetails.setDraftTransportOrder(orderedIds);
    } else {
      updateQuery({
        transportOrder:
          orderedIds.length === 4 ? orderedIds.join(",") : undefined,
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

  const handlePaxAdultsChange = (value: number) => {
    updateQuery({ paxAdults: String(value) });
  };

  const handlePaxMinorsChange = (value: number) => {
    updateQuery({ paxMinors: String(value) });
  };

  const handlePaxPetsChange = (value: number) => {
    updateQuery({ paxPets: String(value) });
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
      paxAdults: undefined,
      paxMinors: undefined,
      paxPets: undefined,
      refineDetails: undefined,
      startDate: undefined,
      transportOrder: undefined,
      travelType: undefined,
      tripRequestId: undefined,
    });
    setAccordionValue("");
    if (onTabChange) onTabChange("budget");
  };

  // Next/Back move one substep at a time within a tab (e.g. Origin -> Dates),
  // only advancing to the next/previous TAB once there's no next/previous
  // substep left in the current one. getTabSubstepOrder is the single source
  // of truth for substep order, shared with page.tsx's getAccordionForStep.
  const substepOrderCtx = {
    hasExcuseStep,
    hasPax: hasPaxSubstep(url.travelType),
    addonsEnabled: JOURNEY_ADDONS_ENABLED,
  };
  const currentSubstepOrder = getTabSubstepOrder(activeTab, substepOrderCtx);
  const currentSubstepIndex = Math.max(
    0,
    currentSubstepOrder.indexOf(accordionValue),
  );
  const currentSubstepId = currentSubstepOrder[currentSubstepIndex];
  const hasNextSubstepInTab =
    currentSubstepIndex < currentSubstepOrder.length - 1;

  const substepCompletionCtx: SubstepCompletionContext = {
    travelType: url.travelType,
    experience: url.experience,
    excuse: url.excuse,
    refineDetails: url.refineDetails,
    originCountry: draftDetails.effectiveOriginCountry,
    originCity: draftDetails.effectiveOriginCity,
    startDate: draftDetails.effectiveStartDate,
    nights: draftDetails.effectiveNights,
    transportOrder: draftDetails.effectiveTransportOrder,
  };

  const nextTab = getNextTab(activeTab, hasExcuseStep);
  const previousTab = getPreviousTab(activeTab, hasExcuseStep);

  // Next is blocked until the CURRENT substep itself has a selection — not
  // the whole tab (e.g. on Origin, Dates being empty doesn't matter yet).
  const canContinue = currentSubstepId
    ? isSubstepValueComplete(activeTab, currentSubstepId, substepCompletionCtx)
    : false;
  const isAllStepsComplete = !hasNextSubstepInTab && !nextTab && canContinue;

  const handleContinue = () => {
    if (hasNextSubstepInTab) {
      setAccordionValue(currentSubstepOrder[currentSubstepIndex + 1]);
      scrollToActions();
      return;
    }
    if (nextTab && onTabChange) {
      onTabChange(nextTab);
      const nextOrder = getTabSubstepOrder(nextTab, substepOrderCtx);
      setAccordionValue(nextOrder[0] ?? "");
      scrollToActions();
    }
  };

  const handleBack = () => {
    if (currentSubstepIndex > 0) {
      setAccordionValue(currentSubstepOrder[currentSubstepIndex - 1]);
      scrollToActions();
      return;
    }
    if (previousTab && onTabChange) {
      onTabChange(previousTab);
      const previousOrder = getTabSubstepOrder(previousTab, substepOrderCtx);
      setAccordionValue(previousOrder[previousOrder.length - 1] ?? "");
      scrollToActions();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "budget": {
        // In curated journeys, filter types to only what the tripper offers.
        // When allowedTypes is undefined, pass the full list (direct journey).
        const filteredTravelerTypes =
          allowedTypes !== undefined
            ? (localizedTravelerTypes ?? []).filter((t) =>
                allowedTypes.includes(t.key),
              )
            : localizedTravelerTypes;

        return (
          <BudgetStep
            accordionValue={accordionValue}
            allowedLevelsByType={allowedLevelsByType}
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
              selectTravelTypeFirst: labels.selectTravelTypeFirst,
              travelTypeLabel: labels.travelTypeLabel,
              noTripperExperiences: labels.noTripperExperiences,
              noLevelsAvailable: labels.noLevelsAvailable,
              browseGeneralExperiences: labels.browseGeneralExperiences,
            }}
            locale={locale}
            localizedTravelerTypes={filteredTravelerTypes}
            minimizeAllFeatures
            onAccordionValueChange={setAccordionValue}
            selectedExperienceLevel={url.experience}
            selectedTravelType={url.travelType as TravelerTypeSlug}
            travelerType={url.travelType as TravelerTypeSlug}
            travelTypeContent={getTravelTypeLabel(
              url.travelType,
              filteredTravelerTypes,
              labels.travelTypePlaceholder,
            )}
            tripperBadge={tripperBadge}
          />
        );
      }
      case "excuse":
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
      case "details":
        if (
          !url.travelType ||
          !url.experience ||
          (hasExcuseStep && !url.excuse)
        ) {
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
            onPaxAdultsChange={handlePaxAdultsChange}
            onPaxMinorsChange={handlePaxMinorsChange}
            onPaxPetsChange={handlePaxPetsChange}
            onRangeChange={handleRangeChange}
            onStartDateChange={handleStartDateChange}
            onTransportOrderChange={handleTransportOrderChange}
            openSectionId={accordionValue || "origin"}
            originCity={draftDetails.effectiveOriginCity}
            originCountry={draftDetails.effectiveOriginCountry}
            paxAdults={effectivePaxAdults}
            paxMinors={effectivePaxMinors}
            paxPets={effectivePaxPets}
            startDate={draftDetails.effectiveStartDate}
            transportOrder={draftDetails.effectiveTransportOrder}
            travelType={url.travelType}
          />
        );
      case "preferences":
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
      case "extras":
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
    <div className={cn("flex-1 min-h-0 flex flex-col", className)}>
      <div className="flex-1" id="journey-actions">
        {renderContent()}
      </div>
      <JourneyActionBar
        canContinue={canContinue}
        isAllStepsComplete={isAllStepsComplete}
        isSavingAndRedirecting={isSavingAndRedirecting}
        labels={{
          back: labels.back,
          clearAll: labels.clearAll,
          next: labels.next,
          processingCheckout: labels.processingCheckout,
          viewCheckout: labels.viewCheckout,
        }}
        onBack={previousTab ? handleBack : undefined}
        onClearAll={handleClearAll}
        onContinue={handleContinue}
        onGoToCheckout={handleGoToCheckout}
        showClearAll={Boolean(url.travelType)}
      />
    </div>
  );
}
