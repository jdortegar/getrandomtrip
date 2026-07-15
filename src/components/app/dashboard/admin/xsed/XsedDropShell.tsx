"use client";

import type React from "react";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { JourneyActionBar } from "@/components/journey/JourneyActionBar";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import type { XsedDropDraft } from "@/types/xsed";
import { EMPTY_XSED_DRAFT } from "@/types/xsed";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import { XsedIdentityStep } from "./steps/XsedIdentityStep";
import { XsedSectionsStep } from "./steps/XsedSectionsStep";
import { XsedGalleryStep } from "./steps/XsedGalleryStep";
import { XsedAccommodationStep } from "./steps/XsedAccommodationStep";
import { XsedActivitiesStep } from "./steps/XsedActivitiesStep";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface XsedDropShellProps {
  dict: AdminXsedDict["form"];
  locale: string;
  initialDraft?: XsedDropDraft;
  initialDraftId?: string;
}

const AUTOSAVE_DELAY_MS = 2000;
const SAVED_RESET_MS = 3000;

// Tabs with no required fields are vacuously "complete" from the start —
// gate their checkmark on visitation too, mirroring NewBlogPostShell's
// OPTIONAL_TABS_REQUIRE_VISIT so a fresh draft doesn't show every tab
// checked before the admin has even opened it.
const OPTIONAL_TABS_REQUIRE_VISIT = new Set(["content", "gallery", "logistics"]);

// Dummy labels — JourneyContentNavigation requires this prop but hideProfile=true hides the badge.
const DUMMY_USER_BADGE_LABELS = {
  guest: "",
  levelLabel: "",
  levels: {
    adventurer: "",
    beginner: "",
    explorer: "",
    nomad: "",
    randomtripper: "",
  },
};


function isXsedTabComplete(tabId: string, form: XsedDropDraft): boolean {
  switch (tabId) {
    case "main":
      return !!(
        form.titleInternal.trim() &&
        form.tripDate &&
        form.destinationCity.trim() &&
        form.destinationCountry.trim()
      );
    default:
      return true;
  }
}

function resolveXsedStepContent(
  activeTab: string,
  substepId: string,
  form: XsedDropDraft,
  onChange: (patch: Partial<XsedDropDraft>) => void,
  dict: AdminXsedDict["form"],
): React.ReactNode {
  if (activeTab === "main") {
    if (substepId === "identity")
      return <XsedIdentityStep copy={dict.fields} form={form} onChange={onChange} />;
  }
  if (activeTab === "content") {
    if (substepId === "sections")
      return (
        <XsedSectionsStep copy={dict.fields.sections} form={form} onChange={onChange} />
      );
  }
  if (activeTab === "gallery") {
    if (substepId === "images")
      return <XsedGalleryStep copy={dict.fields.gallery} form={form} onChange={onChange} />;
  }
  if (activeTab === "logistics") {
    if (substepId === "accommodation")
      return (
        <XsedAccommodationStep copy={dict.fields.accommodation} form={form} onChange={onChange} />
      );
    if (substepId === "activities")
      return (
        <XsedActivitiesStep copy={dict.fields.activities} form={form} onChange={onChange} />
      );
  }
  return null;
}

function SaveIndicator({
  status,
  labels,
}: {
  status: SaveStatus;
  labels: { saving: string; saved: string; error: string };
}) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved" && <Check className="h-3 w-3 text-green-500" />}
      {status === "error" && <AlertCircle className="h-3 w-3 text-red-400" />}
      <span>
        {status === "saving" && labels.saving}
        {status === "saved" && labels.saved}
        {status === "error" && labels.error}
      </span>
    </div>
  );
}

export function XsedDropShell({
  dict,
  locale,
  initialDraft,
  initialDraftId,
}: XsedDropShellProps) {
  const router = useRouter();
  const tabs = dict.contentTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "main");
  const [openSectionId, setOpenSectionId] = useState(
    tabs[0]?.substeps[0]?.id ?? "",
  );
  const [form, setForm] = useState<XsedDropDraft>(
    initialDraft ?? EMPTY_XSED_DRAFT,
  );
  // Editing an existing drop means the admin already went through the whole
  // flow once — mark every tab as visited so optional tabs (content, gallery,
  // logistics) show their checkmark immediately instead of only after being
  // opened.
  const [visitedTabIds, setVisitedTabIds] = useState<Set<string>>(() =>
    initialDraft
      ? new Set(tabs.map((t) => t.id))
      : new Set([tabs[0]?.id ?? "main"]),
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ID lives in a ref so it doesn't retrigger autosave effects
  const draftIdRef = useRef<string | null>(initialDraftId ?? null);
  const isFirstRender = useRef(true);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const persistDraft = useCallback(async (snapshot: XsedDropDraft) => {
    setSaveStatus("saving");
    setSaveError(undefined);
    try {
      if (!draftIdRef.current) {
        const res = await fetch("/api/admin/xsed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        if (!res.ok) throw new Error("Save failed");
        const data = (await res.json()) as { id: string };
        draftIdRef.current = data.id;
      } else {
        const res = await fetch(`/api/admin/xsed/${draftIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        if (!res.ok) throw new Error("Save failed");
      }
      setSaveStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(
        () => setSaveStatus("idle"),
        SAVED_RESET_MS,
      );
    } catch {
      setSaveStatus("error");
    }
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // In create mode, wait until titleInternal has something
    if (!draftIdRef.current && !form.titleInternal.trim()) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => persistDraft(form), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [form, persistDraft]);

  function handleChange(patch: Partial<XsedDropDraft>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };

      return next;
    });
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (draftIdRef.current) {
        const res = await fetch(`/api/admin/xsed/${draftIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Submit failed");
      } else {
        const res = await fetch("/api/admin/xsed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Submit failed");
      }
      router.push(`/${locale}/dashboard/admin`);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const nextTab = tabs[currentIndex + 1];
    if (!nextTab) return;
    handleTabChange(nextTab.id);
  }

  // Unlike NewExperienceShell/NewBlogPostShell, XSED tab navigation is always
  // free — admins can jump to any tab regardless of completion state. Only
  // the "Siguiente" button (via JourneyActionBar's canContinue below) is
  // gated on the active tab's completeness.
  function canNavigateTo(): boolean {
    return true;
  }

  function handleTabChange(tabId: string) {
    if (!canNavigateTo()) return;
    setActiveTab(tabId);
    setVisitedTabIds((prev) => new Set(prev).add(tabId));
    const firstSubstep =
      tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "";
    setOpenSectionId(firstSubstep);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleStepClick(tabId: string, substepId?: string) {
    if (!canNavigateTo()) return;
    setActiveTab(tabId);
    setVisitedTabIds((prev) => new Set(prev).add(tabId));
    setOpenSectionId(
      substepId ??
        tabs.find((t) => t.id === tabId)?.substeps[0]?.id ??
        "",
    );
  }

  const navTabs = tabs.map((t) => ({ id: t.id, label: t.label }));
  const completedTabIds = useMemo(
    () =>
      tabs
        .filter((t) => {
          if (!isXsedTabComplete(t.id, form)) return false;
          if (OPTIONAL_TABS_REQUIRE_VISIT.has(t.id)) return visitedTabIds.has(t.id);
          return true;
        })
        .map((t) => t.id),
    [tabs, form, visitedTabIds],
  );

  const currentTab = tabs.find((t) => t.id === activeTab);
  const isLastTab = tabs[tabs.length - 1]?.id === activeTab;
  const allTabsComplete = tabs.every((t) => isXsedTabComplete(t.id, form));
  const hasValues = !!form.titleInternal;

  return (
    <div className="bg-gray-50">
      <JourneyContentNavigation
        activeTab={activeTab}
        className="py-6"
        hideProfile
        onTabChange={handleTabChange}
        tabs={navTabs}
        userBadgeLabels={DUMMY_USER_BADGE_LABELS}
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
            {currentTab && (
              <div className="flex flex-col gap-4">
                <Accordion
                  type="single"
                  collapsible
                  value={openSectionId}
                  onValueChange={setOpenSectionId}
                  className="flex flex-col gap-4"
                >
                  {currentTab.substeps.map((substep, i) => (
                    <JourneyDropdown
                      key={substep.id}
                      value={substep.id}
                      label={substep.title}
                      content={i === 0 ? "" : ""}
                    >
                      {resolveXsedStepContent(
                        activeTab,
                        substep.id,
                        form,
                        handleChange,
                        dict,
                      )}
                    </JourneyDropdown>
                  ))}
                </Accordion>

                {saveError && saveStatus === "error" && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                    <p className="text-sm text-red-800">{saveError}</p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute left-0 bottom-3">
                    <SaveIndicator
                      status={saveStatus}
                      labels={{
                        saving: dict.saving,
                        saved: dict.saved,
                        error: dict.saveError,
                      }}
                    />
                  </div>

                  <JourneyActionBar
                    canContinue={isXsedTabComplete(activeTab, form)}
                    isAllStepsComplete={isLastTab && allTabsComplete}
                    isSavingAndRedirecting={isSubmitting}
                    labels={{
                      clearAll: dict.actionBar.clearAll,
                      next: dict.actionBar.next,
                      viewCheckout: dict.actionBar.viewCheckout,
                    }}
                    onClearAll={() => setForm(EMPTY_XSED_DRAFT)}
                    onContinue={handleNext}
                    onGoToCheckout={handleSubmit}
                    showClearAll={hasValues}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
