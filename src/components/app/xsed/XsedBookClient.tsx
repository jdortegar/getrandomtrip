"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackCustomEvent } from "@/lib/helpers/tracking/gtm";
import {
  trackProductSelection,
  useProductView,
} from "@/lib/hooks/useCommerceTracking";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getNextWeekend, toISODate } from "@/lib/helpers/xsed-dates";
import { paxDetailsFromTotalPax } from "@/lib/helpers/pax-details";
import { Accordion } from "@/components/ui/accordion";
import ExcuseStep from "@/components/journey/ExcuseStep";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { XsedInternalHero } from "@/components/app/xsed/XsedInternalHero";
import { JourneyActionBar } from "@/components/journey/JourneyActionBar";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import CountrySelector from "@/components/journey/CountrySelector";
import CitySelector from "@/components/journey/CitySelector";
import { XsedSummary } from "@/components/app/xsed/XsedSummary";
import { useUserStore } from "@/store/slices/userStore";
import { useJourneyAutoExcuse } from "@/hooks/useJourneyAutoExcuse";
import { MAX_REFINE_DETAILS, XSED_LEVEL_ID } from "@/lib/constants/product-config";
import { getExcusesByTravelerType } from "@/lib/data/shared/excuses";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";
import { getExcuseLabel, getRefineDetailsLabel } from "@/lib/helpers/journey";
import {
  getExcusesByTypeAndLevel,
  getLocalizedRefineOptions,
  resolveExcuseSelectionLabels,
  toggleRefineDetail as toggleRefineDetailKey,
  type LocalizedRefineOptions,
} from "@/lib/helpers/excuse-helper";
import type { JourneyDetailsStepLabels } from "@/components/journey/JourneyDetailsStep";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";
import type { MarketingDictionary, XsedBookDict } from "@/lib/types/dictionary";
import { getBookingTimeZoneInputs } from "@/lib/helpers/tripTimeZone";
import type { XsedTravelType } from "@/types/core";

type JourneyDict = MarketingDictionary["journey"];

const EXCUSE_SECTIONS = ["reason", "refine-details"];

/** Maps an accordion section to the navigation tab that owns it. */
function tabForSection(section: string): string {
  if (section === "origin") return "details";
  if (EXCUSE_SECTIONS.includes(section)) return "excuse";
  return section;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface XsedBookClientProps {
  book: XsedBookDict;
  detailsStepLabels?: JourneyDetailsStepLabels;
  /** Journey copy (journey.mainContent) so the excuse step reads like /journey. */
  excuseLabels: JourneyDict["mainContent"];
  /** The journey "excuse" content tab (reason + refine-details substeps). */
  excuseTab: JourneyDict["contentTabs"][number];
  experienceId?: string;
  /** Localized excuse titles/descriptions (journey.excuses). */
  localizedExcuses?: Array<{ key: string; title: string; description: string }>;
  /** Localized refine options (journey.refineDetailOptions). */
  localizedRefineOptions?: LocalizedRefineOptions;
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function XsedBookClient({
  book,
  detailsStepLabels,
  excuseLabels,
  excuseTab,
  experienceId,
  localizedExcuses,
  localizedRefineOptions,
  locale,
  userBadgeLabels,
}: XsedBookClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  useProductView("xsed");

  const [originCountry, setOriginCountry] = useState(
    searchParams.get("originCountry") ?? "",
  );
  const [originCountryCode, setOriginCountryCode] = useState("");
  const [originCity, setOriginCity] = useState(
    searchParams.get("originCity") ?? "",
  );
  const [pax, setPax] = useState(2);
  const [travelType, setTravelType] = useState<XsedTravelType | "">("");
  const [excuseKey, setExcuseKey] = useState<string | undefined>(undefined);
  const [refineDetails, setRefineDetails] = useState<string[]>([]);
  const [openSection, setOpenSection] = useState("origin");
  // Kept separately from openSection so collapsing a dropdown keeps the step visible.
  const [activeTab, setActiveTab] = useState("details");

  const selectSection = (section: string) => {
    setOpenSection(section);
    if (section) setActiveTab(tabForSection(section));
  };
  const [isSaving, setIsSaving] = useState(false);

  const { saturday, sunday } = useMemo(() => getNextWeekend(), []);

  const travelTypeLabel = travelType ? book.travelType[travelType] : "";

  // Excuses depend on the travel type chosen in the pax step.
  const excuses = useMemo(
    () =>
      travelType ? getExcusesByTypeAndLevel(travelType, XSED_LEVEL_ID) : [],
    [travelType],
  );
  const excuseKeys = useMemo(() => excuses.map((e) => e.key), [excuses]);
  const refineOptions = useMemo(
    () =>
      travelType
        ? getLocalizedRefineOptions(
            travelType,
            excuseKey,
            localizedRefineOptions,
          )
        : [],
    [travelType, excuseKey, localizedRefineOptions],
  );
  const tabs = useMemo(
    () => [...book.contentTabs, excuseTab],
    [book.contentTabs, excuseTab],
  );
  const resolvedExcuse = resolveExcuseSelectionLabels({
    travelerType: travelType,
    excuseKey,
    refineDetails,
    localizedExcuses,
    localizedRefineOptions,
  });

  const selectExcuse = (key: string) => {
    setExcuseKey(key);
    setRefineDetails([]);
  };

  const toggleRefineDetail = (key: string) => {
    setRefineDetails((current) =>
      toggleRefineDetailKey(current, key, MAX_REFINE_DETAILS),
    );
  };

  // Family has a single excuse: select it so the user goes straight to refine details.
  useJourneyAutoExcuse({
    enabled: excuses.length > 0,
    excuseKeys,
    selectedExcuse: excuseKey,
    onSelect: (key) => {
      selectExcuse(key);
      if (openSection === "reason") selectSection("refine-details");
    },
  });

  // Applies a travel type and drops an excuse that does not belong to it.
  const applyTravelType = (next: XsedTravelType | "") => {
    setTravelType(next);
    if (
      excuseKey &&
      !getExcusesByTravelerType(next).some((e) => e.key === excuseKey)
    ) {
      setExcuseKey(undefined);
      setRefineDetails([]);
    }
  };

  const sectionForTab = (tabId: string) =>
    tabId === "details" ? "origin" : tabId === "excuse" ? "reason" : tabId;

  const handleTabChange = (tabId: string) => {
    selectSection(sectionForTab(tabId));
  };

  const handleStepClick = (tabId: string, substepId?: string) => {
    selectSection(substepId ?? sectionForTab(tabId));
  };

  const handleSummaryEdit = (sectionId: string) => {
    selectSection(sectionForTab(sectionId));
  };

  const handleOriginCountryChange = (name: string, code: string) => {
    setOriginCountry(name);
    setOriginCountryCode(code);
    setOriginCity("");
    const next = new URLSearchParams(searchParams.toString());
    if (name) next.set("originCountry", name);
    else next.delete("originCountry");
    next.delete("originCity");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const handleOriginCityChange = (value: string) => {
    setOriginCity(value);
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("originCity", value);
    else next.delete("originCity");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const isOriginComplete = Boolean(originCountry && originCity);
  const isTravelTypeComplete = Boolean(travelType);
  const isExcuseComplete = Boolean(excuseKey);
  const canBook = isOriginComplete && isTravelTypeComplete && isExcuseComplete;
  const canContinue =
    (isOriginComplete && openSection === "origin") ||
    (isOriginComplete && isTravelTypeComplete && openSection === "pax") ||
    (isExcuseComplete && openSection === "reason");
  // Like /journey: checkout shows once there is no further substep to continue to.
  const isAllStepsComplete = canBook && !canContinue;
  const showClearAll = Boolean(
    originCountry || originCity || pax !== 2 || travelType || excuseKey,
  );

  const completedTabIds = [
    ...(isOriginComplete ? ["details"] : []),
    ...(isTravelTypeComplete ? ["pax"] : []),
    ...(isExcuseComplete ? ["excuse"] : []),
  ];

  const handleContinue = () => {
    if (openSection === "origin") selectSection("pax");
    else if (openSection === "pax") {
      // A single-excuse type skips the reason picker, like /journey.
      selectSection(excuses.length === 1 ? "refine-details" : "reason");
    } else if (openSection === "reason") selectSection("refine-details");
  };

  const handlePaxChange = (value: string) => {
    const count = Number(value);
    const nextPax = Math.max(1, count || 1);
    setPax(nextPax);
    if (nextPax === 1) applyTravelType("solo");
    else if (nextPax > 1 && travelType === "solo") applyTravelType("");
  };

  // Solo is one traveler by definition.
  const handleTravelTypeChange = (value: XsedTravelType) => {
    if (pax === 1 && value !== "solo") return;
    if (value !== travelType) trackProductSelection("xsed");
    applyTravelType(value);
    if (value === "solo") setPax(1);
  };

  const handleClearAll = () => {
    setOriginCountry("");
    setOriginCity("");
    setPax(2);
    setTravelType("");
    setExcuseKey(undefined);
    setRefineDetails([]);
    selectSection("origin");
    router.replace("?", { scroll: false });
  };

  const handleBook = useCallback(async () => {
    if (!originCountry || !originCity) {
      toast.error(book.toasts.originRequired);
      return;
    }
    if (!travelType) {
      toast.error(book.toasts.travelTypeRequired);
      return;
    }
    if (!excuseKey) {
      toast.error(book.toasts.excuseRequired);
      return;
    }
    if (sessionStatus === "loading") {
      toast.info(book.toasts.sessionLoading);
      return;
    }
    if (!session?.user?.email) {
      const { openAuth } = useUserStore.getState();
      openAuth("signin");
      toast.info(book.toasts.signInRequired);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/trip-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "xsed",
          level: travelType,
          originCountry,
          originCity,
          ...getBookingTimeZoneInputs({
            countryCode: originCountryCode,
            countryName: originCountry,
          }),
          pax,
          paxDetails: paxDetailsFromTotalPax(pax),
          startDate: toISODate(saturday),
          endDate: toISODate(sunday),
          nights: 1,
          excuseKey,
          refineDetails,
          status: "SAVED",
          ...(experienceId ? { experienceId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const { openAuth } = useUserStore.getState();
          openAuth("signin");
          toast.info(book.toasts.signInRequired);
        } else if (data.errorCode === "EXCUSE_REQUIRED") {
          toast.error(book.toasts.excuseRequired);
        } else {
          toast.error(book.toasts.saveFailed);
        }
        return;
      }
      trackCustomEvent({ event: "generate_lead", trip_type: "xsed" });
      router.push(`/${locale}/checkout?tripId=${data.tripRequest.id}`);
    } catch {
      toast.error(book.toasts.connectionError);
    } finally {
      setIsSaving(false);
    }
  }, [
    book.toasts,
    excuseKey,
    refineDetails,
    originCity,
    originCountry,
    originCountryCode,
    pax,
    travelType,
    locale,
    router,
    session,
    sessionStatus,
    experienceId,
    saturday,
    sunday,
  ]);

  return (
    <div className="min-h-screen bg-ground" data-component="XsedBookClient">
      <XsedInternalHero
        content={{
          description: book.hero.description,
          backgroundImage: book.hero.fallbackImage,
          videoSrc: book.hero.videoSrc,
        }}
        hero={{
          title: book.hero.brand,
          label: book.hero.label,
          subtitle: book.hero.subtitle,
          fallbackImage: book.hero.fallbackImage,
        }}
        maxHeight="50vh"
      />

      <JourneyContentNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
        userBadgeLabels={userBadgeLabels}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row w-full gap-8">
          {/* Progress sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start hidden lg:block">
            <JourneyProgressSidebar
              activeSubstepId={openSection}
              activeTab={activeTab}
              addonsComingSoonLabel=""
              completedTabIds={completedTabIds}
              onStepClick={handleStepClick}
              progressLabel={book.hero.progressLabel}
              tabs={tabs}
            />
          </div>

          {/* Main form */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex-1 space-y-4">
              {activeTab !== "excuse" && (
                <Accordion
                  collapsible
                  onValueChange={selectSection}
                  type="single"
                  value={openSection}
                >
                  <div className="space-y-4">
                    {activeTab === "details" && (
                      <JourneyDropdown
                        content={
                          originCountry && originCity
                            ? `${originCountry} · ${originCity}`
                            : originCountry ||
                              (detailsStepLabels?.originPlaceholder ??
                                "Elegí país y ciudad de salida")
                        }
                        label={detailsStepLabels?.originLabel ?? "Origen"}
                        value="origin"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-base font-bold text-gray-700">
                              {detailsStepLabels?.countryLabel ??
                                "País de salida"}
                            </label>
                            <CountrySelector
                              onChange={handleOriginCountryChange}
                              placeholder={
                                detailsStepLabels?.countryPlaceholder ??
                                "Escribir país de salida"
                              }
                              size="lg"
                              value={originCountry}
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-base font-bold text-gray-700">
                              {detailsStepLabels?.cityLabel ??
                                "Ciudad de salida"}
                            </label>
                            <CitySelector
                              countryCode={originCountryCode}
                              onChange={handleOriginCityChange}
                              placeholder={
                                detailsStepLabels?.cityPlaceholder ??
                                "Escribir ciudad de salida"
                              }
                              size="lg"
                              value={originCity}
                            />
                          </div>
                        </div>
                      </JourneyDropdown>
                    )}

                    {activeTab === "pax" && (
                      <JourneyDropdown
                        content={
                          travelTypeLabel
                            ? `${travelTypeLabel} · ${
                                pax === 1
                                  ? book.pax.countOne.replace(
                                      "{count}",
                                      String(pax),
                                    )
                                  : book.pax.countOther.replace(
                                      "{count}",
                                      String(pax),
                                    )
                              }`
                            : pax === 1
                              ? book.pax.countOne.replace(
                                  "{count}",
                                  String(pax),
                                )
                              : book.pax.countOther.replace(
                                  "{count}",
                                  String(pax),
                                )
                        }
                        label={book.pax.label}
                        value="pax"
                      >
                        <div className="flex flex-wrap items-start justify-start gap-6">
                          <div className="w-full max-w-32">
                            <FormField
                              id="xsed-pax"
                              label={book.pax.label}
                              min={1}
                              onChange={(e) => handlePaxChange(e.target.value)}
                              type="number"
                              value={pax}
                            />
                          </div>

                          <div className="w-full max-w-56">
                            <FormSelectField
                              id="xsed-travel-type"
                              label={book.travelType.label}
                              onChange={(e) =>
                                handleTravelTypeChange(
                                  e.target.value as XsedTravelType,
                                )
                              }
                              value={travelType}
                            >
                              <option disabled value="">
                                {book.travelType.placeholder}
                              </option>
                              <option value="solo">
                                {book.travelType.solo}
                              </option>
                              <option disabled={pax === 1} value="couple">
                                {book.travelType.couple}
                              </option>
                              <option disabled={pax === 1} value="family">
                                {book.travelType.family}
                              </option>
                              <option disabled={pax === 1} value="group">
                                {book.travelType.group}
                              </option>
                            </FormSelectField>
                          </div>
                        </div>
                      </JourneyDropdown>
                    )}
                  </div>
                </Accordion>
              )}
              {activeTab === "excuse" && (
                <ExcuseStep
                  accordionValue={openSection}
                  excuse={excuseKey}
                  excuses={excuses}
                  experience={XSED_LEVEL_ID}
                  getExcuseLabel={getExcuseLabel(
                    excuseKey,
                    excuses,
                    excuseLabels.excusePlaceholder,
                  )}
                  getRefineDetailsLabel={getRefineDetailsLabel(
                    refineDetails,
                    refineOptions,
                    excuseLabels.refineDetailsOneSelected,
                    excuseLabels.refineDetailsCountSelected,
                    excuseLabels.refineDetailsPlaceholder,
                  )}
                  hasExcuseStep
                  labels={{
                    ...excuseLabels,
                    completeBudgetFirst: excuseLabels.selectTravelTypeFirst,
                  }}
                  localizedExcuses={localizedExcuses}
                  onAccordionValueChange={selectSection}
                  onClearRefineDetails={() => setRefineDetails([])}
                  onSelectExcuse={selectExcuse}
                  onSelectRefineDetails={toggleRefineDetail}
                  refineDetails={refineDetails}
                  refineDetailsOptions={refineOptions}
                  travelType={
                    (travelType || undefined) as TravelerTypeSlug | undefined
                  }
                />
              )}
              <JourneyActionBar
                canContinue={canContinue}
                isAllStepsComplete={isAllStepsComplete}
                isSavingAndRedirecting={isSaving}
                labels={book.actionBar}
                onClearAll={handleClearAll}
                onContinue={handleContinue}
                onGoToCheckout={handleBook}
                showClearAll={showClearAll}
              />
            </div>
          </div>

          {/* Order summary */}
          <XsedSummary
            brand={book.hero.brand}
            copy={book.summary}
            excuse={resolvedExcuse}
            onEdit={handleSummaryEdit}
            originCity={originCity}
            originCountry={originCountry}
            pax={pax}
            travelType={travelType}
            travelTypeLabel={travelTypeLabel}
          />
        </div>
      </div>
    </div>
  );
}
