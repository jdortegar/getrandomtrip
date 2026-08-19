"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, use } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { useRouter, useSearchParams } from "next/navigation";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import HeaderHero from "@/components/journey/HeaderHero";
import JourneyMainContent from "@/components/journey/JourneyMainContent";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import JourneySummary from "@/components/journey/JourneySummary";
import { TripperUnavailableNotice } from "@/components/tripper/TripperUnavailableNotice";
import { DashboardNavbarPrimaryLayout } from "@/components/app/dashboard/DashboardNavbarPrimaryLayout";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getHasExcuseStep } from "@/lib/helpers/excuse-helper";
import { filterContentTabsForUI, getAccordionForStep } from "@/lib/helpers/journey";
import { isCompleteTransportOrderParam } from "@/lib/helpers/transport";
import type { TripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides";
import { JOURNEY_ADDONS_ENABLED } from "config/journey-features";
import type { JourneyDetailsProgress } from "@/hooks/useJourneyDetailsProgress";
import {
  clearPendingJourneyDraftIdSession,
  consumePendingJourneyDraftId,
  saveJourneyDraftQueryString,
} from "@/lib/helpers/journeyDraftStorage";

function getTabForSection(sectionId: string): string {
  switch (sectionId) {
    case "travel-type":
    case "experience":
      return "budget";
    case "reason":
    case "refine-details":
      return "excuse";
    case "pax":
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
  if (hasExcuseStep && !excuse) return { tabId: "excuse", sectionId: "reason" };
  if (hasExcuseStep && excuse) return { tabId: "excuse", sectionId: "reason" };
  if (!originCountry || !originCity)
    return { tabId: "details", sectionId: "origin" };
  if (!startDate || !nights) return { tabId: "details", sectionId: "dates" };
  if (!isCompleteTransportOrderParam(transportOrder))
    return { tabId: "details", sectionId: "transport" };
  return { tabId: "preferences", sectionId: "filters" };
}

interface TripperJourneyContext {
  name: string;
  avatarUrl: string | null;
  location: string | null;
  allowedTypes: string[];
  allowedLevelsByType: Record<string, string[]>;
  priceOverrides: TripperPriceOverrides | null;
}

/**
 * Explicit tri-state so "no tripper in the URL" (`none`) can never be
 * confused with "tripper unavailable" (`unavailable`) — a nullable
 * `TripperJourneyContext | null` could not distinguish the two.
 */
type TripperContextState =
  | { status: "none" }
  | { status: "ok"; context: TripperJourneyContext }
  | { status: "unavailable"; name?: string };

function JourneyPageContent({ locale }: { locale?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [activeTab, setActiveTab] = useState("budget");
  const [openSectionId, setOpenSectionId] = useState("travel-type");
  const [tripperState, setTripperState] = useState<TripperContextState>({
    status: "none",
  });
  const hasSyncedJourneyStateFromUrl = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Live, draft-aware completion for the "details" tab's Origin/Dates/
  // Transport substeps — relayed here from JourneyMainContent (which owns
  // the draft state) so JourneyProgressSidebar (a sibling, not a child) can
  // show real-time dots instead of the stale ones its own search-param-based
  // check would produce while the user is actively editing. See
  // useJourneyDetailsProgress.ts for the full rationale.
  const [detailsProgress, setDetailsProgress] = useState<JourneyDetailsProgress>(
    { origin: false, dates: false, transport: false, complete: false },
  );
  const handleDetailsProgressChange = useCallback(
    (next: JourneyDetailsProgress) => {
      setDetailsProgress((prev) =>
        prev.origin === next.origin &&
        prev.dates === next.dates &&
        prev.transport === next.transport &&
        prev.complete === next.complete
          ? prev
          : next,
      );
    },
    [],
  );
  const detailsTabCompletionOverrides = useMemo(
    () => ({ details: detailsProgress.complete }),
    [detailsProgress.complete],
  );
  const detailsSubstepCompletionOverrides = useMemo(
    () => ({
      "details:origin": detailsProgress.origin,
      "details:dates": detailsProgress.dates,
      "details:transport": detailsProgress.transport,
    }),
    [detailsProgress.origin, detailsProgress.dates, detailsProgress.transport],
  );

  const resolvedLocale = hasLocale(locale) ? locale : "es";

  // Fetch tripper context when the journey URL includes ?tripper=<slug>
  useEffect(() => {
    const tripperSlug = searchParams.get("tripper");
    if (!tripperSlug) {
      setTripperState({ status: "none" });
      return;
    }
    let cancelled = false;
    fetch(`/api/trippers/${encodeURIComponent(tripperSlug)}/journey-context`)
      .then(async (res) => {
        if (res.status === 410) {
          const body = (await res.json().catch(() => ({}))) as {
            name?: string;
          };
          return { status: "unavailable" as const, name: body.name };
        }
        if (!res.ok) return { status: "none" as const };
        const context = (await res.json()) as TripperJourneyContext;
        return { status: "ok" as const, context };
      })
      .then((next) => {
        if (!cancelled) setTripperState(next);
      })
      .catch(() => {
        if (!cancelled) setTripperState({ status: "none" });
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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
    setOpenSectionId(getAccordionForStep(tabId, substepId, travelType, JOURNEY_ADDONS_ENABLED));
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

  if (tripperState.status === "unavailable") {
    return (
      <DashboardNavbarPrimaryLayout>
        <TripperUnavailableNotice
          copy={dict.trippers.unavailable}
          ctaHref={pathForLocale(resolvedLocale, "/trippers")}
          tripperName={tripperState.name}
        />
      </DashboardNavbarPrimaryLayout>
    );
  }

  const journey = dict.journey;
  const tripperContext =
    tripperState.status === "ok" ? tripperState.context : undefined;
  const travelType = searchParams.get("travelType");
  const experience = searchParams.get("experience");
  const hasExcuseStep = getHasExcuseStep(travelType ?? "", experience ?? "");
  const contentTabsForUI = filterContentTabsForUI(journey.contentTabs, {
    travelType,
    hasExcuseStep,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHero
        description={journey.hero.description}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={journey.hero.subtitle}
        title={journey.hero.title}
        tripperBadge={
          tripperContext
            ? {
                name: tripperContext.name,
                avatarUrl: tripperContext.avatarUrl,
                location: tripperContext.location,
              }
            : undefined
        }
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
              activeSubstepId={openSectionId}
              activeTab={activeTab}
              addonsComingSoonLabel={journey.mainContent.addonsComingSoon}
              onStepClick={handleStepClick}
              substepCompletionOverrides={detailsSubstepCompletionOverrides}
              tabCompletionOverrides={detailsTabCompletionOverrides}
              tabs={contentTabsForUI}
            />
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start min-w-0 flex-1">
            <JourneyMainContent
              activeTab={activeTab}
              addonLabels={journey.addons}
              allowedLevelsByType={tripperContext?.allowedLevelsByType}
              allowedTypes={tripperContext?.allowedTypes}
              tripperPriceOverrides={tripperContext?.priceOverrides ?? null}
              detailsStepLabels={journey.detailsStep}
              localizedExcuses={journey.excuses}
              localizedRefineOptions={journey.refineDetailOptions}
              localizedTravelerTypes={dict.home.exploration.travelerTypes}
              mainContentLabels={journey.mainContent}
              onDetailsProgressChange={handleDetailsProgressChange}
              onOpenSection={setOpenSectionId}
              onTabChange={handleTabChange}
              openSectionId={openSectionId}
              preferencesStepLabels={journey.preferencesStep}
              tripperBadge={
                tripperContext
                  ? {
                      name: tripperContext.name,
                      avatarUrl: tripperContext.avatarUrl,
                    }
                  : undefined
              }
              tripperSlug={searchParams.get("tripper") ?? undefined}
            />
          </div>

          <JourneySummary
            addonLabels={journey.addons}
            filterOptions={journey.preferencesStep.filterOptions}
            tripperPriceOverrides={tripperContext?.priceOverrides ?? null}
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
              summaryHeroPriceCaption: journey.checkout.summaryHeroPriceCaption,
              totalLabel: journey.checkout.totalLabel,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function JourneyPageClient(props: {
  params?: Promise<{ locale?: string }>;
}) {
  const params = use(props.params ?? Promise.resolve({ locale: undefined }));
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <JourneyPageContent locale={params?.locale} />
    </Suspense>
  );
}
