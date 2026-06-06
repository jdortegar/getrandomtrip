"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { ExperienceFormContent } from "./ExperienceFormContent";
import type { ExperienceFormDraft } from "@/types/tripper";
import { isExperienceTabComplete } from "@/lib/helpers/experience-form";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface NewExperienceShellProps {
  dict: TripperExperiencesDict["form"];
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  initialDraft?: ExperienceFormDraft;
  initialDraftId?: string;
}

const EMPTY_DRAFT: ExperienceFormDraft = {
  status: "DRAFT",
  title: "",
  type: "couple",
  level: "essenza",
  teaser: "",
  description: "",
  heroImage: "",
  tags: [],
  highlights: [],
  destinationCountry: "",
  destinationCity: "",
  excuseKey: "",
  climate: "any",
  minPax: 1,
  maxPax: 1,
  minNights: 1,
  maxNights: 2,
  basePrice: 0,
  displayPrice: "",
  estimatedCost: "",
  season: "",
  transport: "any",
  travelTime: "",
  maxTravelTime: "no-limit",
  departPref: "any",
  arrivePref: "any",
  accommodationType: "any",
  accommodations: [
    { hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "" },
  ],
  activities: [{ name: "", durationRhythm: "", description: "", risks: "" }],
  itinerary: [{ title: "", description: "" }],
  inclusions: [],
  exclusions: [],
};

const AUTOSAVE_DELAY_MS = 2000;

export function NewExperienceShell({
  dict,
  locale,
  userBadgeLabels,
  initialDraft,
  initialDraftId,
}: NewExperienceShellProps) {
  const router = useRouter();
  const tabs = dict.contentTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "about");
  const [openSectionId, setOpenSectionId] = useState(
    tabs[0]?.substeps[0]?.id ?? "",
  );
  const [form, setForm] = useState<ExperienceFormDraft>(
    initialDraft ?? EMPTY_DRAFT,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const draftIdRef = useRef<string | null>(initialDraftId ?? null);
  const isFirstRender = useRef(true);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const persistDraft = useCallback(async (snapshot: ExperienceFormDraft) => {
    setSaveStatus("saving");
    try {
      if (!draftIdRef.current) {
        const res = await fetch("/api/tripper/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { id: string };
        draftIdRef.current = data.id;
      } else {
        const res = await fetch(
          `/api/tripper/experiences/${draftIdRef.current}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(snapshot),
          },
        );
        if (!res.ok) throw new Error();
      }
      setSaveStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // In create mode, don't persist until the user has at least typed a title
    if (!draftIdRef.current && !form.title.trim()) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => persistDraft(form), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [form, persistDraft]);

  function canNavigateTo(targetTabId: string): boolean {
    const targetIndex = tabs.findIndex((t) => t.id === targetTabId);
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (targetIndex <= currentIndex) return true;
    for (let i = 0; i < targetIndex; i++) {
      if (!isExperienceTabComplete(tabs[i]!.id, form)) return false;
    }
    return true;
  }

  function handleTabChange(tabId: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    const firstSubstep =
      tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "";
    setOpenSectionId(firstSubstep);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleStepClick(tabId: string, substepId?: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    setOpenSectionId(
      substepId ?? tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "",
    );
  }

  function handleNext() {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const nextTab = tabs[currentIndex + 1];
    if (nextTab) handleTabChange(nextTab.id);
  }

  function handleClearAll() {
    setForm(EMPTY_DRAFT);
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (draftIdRef.current) {
        const res = await fetch(
          `/api/tripper/experiences/${draftIdRef.current}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          },
        );
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/tripper/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
      }
      router.push(`/${locale}/dashboard/tripper/experiences`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange<K extends keyof ExperienceFormDraft>(
    key: K,
    value: ExperienceFormDraft[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const navTabs = tabs.map((t) => ({ id: t.id, label: t.label }));
  const completedTabIds = useMemo(
    () =>
      tabs.filter((t) => isExperienceTabComplete(t.id, form)).map((t) => t.id),
    [tabs, form],
  );

  return (
    <div className="bg-gray-50">
      <JourneyContentNavigation
        activeTab={activeTab}
        className="py-6"
        completedTabIds={completedTabIds}
        hideProfile
        onTabChange={handleTabChange}
        tabs={navTabs}
        userBadgeLabels={userBadgeLabels}
      />

      <div className="rt-container py-8" ref={contentRef}>
        <div className="flex flex-col lg:flex-row w-full gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
            <JourneyProgressSidebar
              activeTab={activeTab}
              activeSubstepId={openSectionId}
              completedTabIds={completedTabIds}
              addonsComingSoonLabel=""
              progressLabel={dict.nav.progress}
              onStepClick={handleStepClick}
              tabs={tabs}
            />
          </div>

          {/* Form */}
          <div className="min-w-0 flex-1">
            <ExperienceFormContent
              activeTab={activeTab}
              copy={dict}
              form={form}
              isSubmitting={isSubmitting}
              saveStatus={saveStatus}
              onChange={handleChange}
              onClearAll={handleClearAll}
              onNext={handleNext}
              onSubmit={handleSubmit}
              openSectionId={openSectionId}
              onSectionChange={setOpenSectionId}
              tabs={tabs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
