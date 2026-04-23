"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { useRouter, useSearchParams } from "next/navigation";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import HeaderHero from "@/components/journey/HeaderHero";
import JourneyMainContent from "@/components/journey/JourneyMainContent";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import JourneySummary from "@/components/journey/JourneySummary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getHasExcuseStep } from "@/lib/helpers/excuse-helper";
import { isCompleteTransportOrderParam } from "@/lib/helpers/transport";
import { JOURNEY_ADDONS_ENABLED } from "config/journey-features";
import {
  clearPendingJourneyDraftIdSession,
  consumePendingJourneyDraftId,
  saveJourneyDraftQueryString,
} from "@/lib/helpers/journeyDraftStorage";

function getAccordionForStep(tabId: string, substepId?: string): string {
  switch (tabId) {
    case "budget":
      return substepId === "experience" ? "experience" : "travel-type";
    case "excuse":
      return substepId === "refine-details" ? "refine-details" : "excuse";
    case "details":
      if (substepId === "dates") return "dates";
      if (substepId === "transport") return "transport";
      return "origin";
    case "preferences":
      if (substepId === "addons" && JOURNEY_ADDONS_ENABLED) return "addons";
      return "filters";
    default:
      return "";
  }
}

function getTabForSection(sectionId: string): string {
  switch (sectionId) {
    case "travel-type":
    case "experience":
      return "budget";
    case "excuse":
    case "refine-details":
      return "excuse";
    case "origin":
    case "dates":
    case "transport":
      return "details";
    case "filters":
    case "addons":
      return "preferences";
    default:
      return "budget";
  }
}

function getInitialStepFromParams(params: URLSearchParams): {
  sectionId: string;
  tabId: string;
} {
  const travelType = params.get("travelType");
  const experience = params.get("experience");
  const excuse = params.get("excuse");
  const originCountry = params.get("originCountry");
  const originCity = params.get("originCity");
  const startDate = params.get("startDate");
  const nights = params.get("nights");
  const transportOrder = params.get("transportOrder");

  if (!travelType) return { tabId: "budget", sectionId: "travel-type" };
  if (!experience) return { tabId: "budget", sectionId: "travel-type" };
  const hasExcuseStep = getHasExcuseStep(travelType ?? "", experience ?? "");
  if (hasExcuseStep && !excuse) return { tabId: "excuse", sectionId: "excuse" };
  if (hasExcuseStep && excuse) return { tabId: "excuse", sectionId: "excuse" };
  if (!originCountry || !originCity)
    return { tabId: "details", sectionId: "origin" };
  if (!startDate || !nights) return { tabId: "details", sectionId: "dates" };
  if (!isCompleteTransportOrderParam(transportOrder))
    return { tabId: "details", sectionId: "transport" };
  return { tabId: "preferences", sectionId: "filters" };
}

function JourneyPageContent({ locale }: { locale?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [activeTab, setActiveTab] = useState("budget");
  const [openSectionId, setOpenSectionId] = useState("travel-type");
  const hasSyncedJourneyStateFromUrl = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const resolvedLocale = hasLocale(locale) ? locale : "es";

  useEffect(() => {
    getDictionary(resolvedLocale).then(setDict);
  }, [resolvedLocale]);

  useEffect(() => {
    const inUrl = searchParams.get("draftId");
    if (inUrl) {
      clearPendingJourneyDraftIdSession();
      return;
    }
    const id = consumePendingJourneyDraftId();
    const next = new URLSearchParams(searchParams.toString());
    if (next.get("draftId") === id) return;
    next.set("draftId", id);
    router.replace(`?${next.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const journeyQuerySnapshot = searchParams.toString();
  useEffect(() => {
    const draftId = new URLSearchParams(journeyQuerySnapshot).get("draftId");
    if (!draftId) return;
    saveJourneyDraftQueryString(draftId, journeyQuerySnapshot);
  }, [journeyQuerySnapshot]);

  // Apply URL → tab/accordion once on load (e.g. shared link). In-flow URL updates from selections
  // do not change tab or accordion; users advance with Continue, sidebar, or summary edit.
  useEffect(() => {
    if (hasSyncedJourneyStateFromUrl.current) return;
    const { tabId, sectionId } = getInitialStepFromParams(searchParams);
    setActiveTab(tabId);
    setOpenSectionId(sectionId);
    hasSyncedJourneyStateFromUrl.current = true;
  }, [searchParams]);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleStepClick = (tabId: string, substepId?: string) => {
    setActiveTab(tabId);
    setOpenSectionId(getAccordionForStep(tabId, substepId));
  };

  const handleSummaryEdit = (sectionId: string) => {
    setActiveTab(getTabForSection(sectionId));
    setOpenSectionId(sectionId);
  };

  if (!dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const journey = dict.journey;
  const travelType = searchParams.get("travelType");
  const experience = searchParams.get("experience");
  const hasExcuseStep = getHasExcuseStep(travelType ?? "", experience ?? "");
  const contentTabsForUI = hasExcuseStep
    ? journey.contentTabs
    : journey.contentTabs.filter((tab) => tab.id !== "excuse");

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHero
        description={journey.hero.description}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={journey.hero.subtitle}
        title={journey.hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <JourneyContentNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={contentTabsForUI.map((tab) => ({ id: tab.id, label: tab.label }))}
        userBadgeLabels={journey.userBadge}
      />

      <div className="container mx-auto px-4 py-8" ref={contentRef}>
        <div className="flex flex-col lg:flex-row w-full gap-8">
          <div className="lg:sticky lg:top-8 lg:self-start hidden lg:block">
            <JourneyProgressSidebar
              activeTab={activeTab}
              addonsComingSoonLabel={journey.mainContent.addonsComingSoon}
              onStepClick={handleStepClick}
              tabs={contentTabsForUI}
            />
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start min-w-0 flex-1">
            <JourneyMainContent
              activeTab={activeTab}
              addonLabels={journey.addons}
              detailsStepLabels={journey.detailsStep}
              localizedExcuses={journey.excuses}
              localizedRefineOptions={journey.refineDetailOptions}
              localizedTravelerTypes={dict.home.exploration.travelerTypes}
              mainContentLabels={journey.mainContent}
              onOpenSection={setOpenSectionId}
              onTabChange={handleTabChange}
              openSectionId={openSectionId}
              preferencesStepLabels={journey.preferencesStep}
            />
          </div>

          <JourneySummary
            addonLabels={journey.addons}
            filterOptions={journey.preferencesStep.filterOptions}
            localizedExcuses={hasExcuseStep ? journey.excuses : undefined}
            onEdit={handleSummaryEdit}
            refineDetailOptions={
              hasExcuseStep ? journey.refineDetailOptions : undefined
            }
            summary={journey.summary}
            totalsLabels={{
              addonsPerPersonLabel: journey.checkout.addonsPerPersonLabel,
              filterFeeLabel: journey.checkout.filterFeeLabel,
              filterFeeLine: journey.checkout.filterFeeLine,
              filterFeeLineFirstFree: journey.checkout.filterFeeLineFirstFree,
              filterFeeLineNone: journey.checkout.filterFeeLineNone,
              filterFeePaxLine: journey.checkout.filterFeePaxLine,
              perPersonSectionTitle: journey.checkout.perPersonSectionTitle,
              subtotalPerPersonLabel: journey.checkout.subtotalPerPersonLabel,
              summaryHeroPriceCaption:
                journey.checkout.summaryHeroPriceCaption,
              totalLabel: journey.checkout.totalLabel,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function JourneyPage({
  params,
}: {
  params?: { locale?: string };
}) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <JourneyPageContent locale={params?.locale} />
    </Suspense>
  );
}
