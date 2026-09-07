"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { JourneyActionBar } from "@/components/journey/JourneyActionBar";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import type { XsedDropDraft } from "@/types/xsed";
import { EMPTY_XSED_DRAFT } from "@/types/xsed";
import type { AdminXsedDict } from "@/lib/types/dictionary";
import { persistXsedDraft } from "@/lib/helpers/persistXsedDraft";
import {
  canPublishXsedDrop,
  isXsedTabComplete,
  resolveXsedFinalizeCopy,
} from "@/lib/helpers/xsed-form";
import { cn } from "@/lib/utils";
import { resolveXsedStepContent } from "./resolveXsedStepContent";
import { XsedSaveIndicator, type SaveStatus } from "./XsedSaveIndicator";

interface XsedDropShellProps {
  dict: AdminXsedDict["form"];
  initialDraft?: XsedDropDraft;
  initialDraftId?: string;
  locale: string;
}

const AUTOSAVE_DELAY_MS = 2000;
const SAVED_RESET_MS = 3000;

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

export function XsedDropShell({
  dict,
  initialDraft,
  initialDraftId,
  locale,
}: XsedDropShellProps) {
  const router = useRouter();
  const tabs = dict.contentTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "main");
  const [openSectionId, setOpenSectionId] = useState(tabs[0]?.substeps[0]?.id ?? "");
  const [form, setForm] = useState<XsedDropDraft>(initialDraft ?? EMPTY_XSED_DRAFT);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const draftIdRef = useRef<string | null>(initialDraftId ?? null);
  const isFirstRender = useRef(true);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isEditingExisting = !!initialDraftId;
  const finalizeCopy = resolveXsedFinalizeCopy(dict, form.status);

  const persistDraft = useCallback(
    async (snapshot: XsedDropDraft) => {
      setSaveStatus("saving");
      setSaveError(undefined);
      try {
        const id = await persistXsedDraft(snapshot, draftIdRef.current, dict.saveError);
        draftIdRef.current = id;
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_RESET_MS);
      } catch (err) {
        setSaveStatus("error");
        setSaveError(err instanceof Error ? err.message : dict.saveError);
        throw err;
      }
    },
    [dict.saveError],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isEditingExisting || isSubmitting) return;
    if (!draftIdRef.current && !form.titleInternal.trim()) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      void persistDraft(form).catch(() => undefined);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [form, persistDraft, isEditingExisting, isSubmitting]);

  function handleChange(patch: Partial<XsedDropDraft>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleRequestSubmit() {
    if (isSubmitting || !canPublishXsedDrop(form)) return;
    setShowConfirm(true);
  }

  async function handleConfirmSubmit() {
    if (isSubmitting) return;
    setShowConfirm(false);
    setIsSubmitting(true);
    setSaveError(undefined);
    const snapshot = finalizeCopy.isPublish ? { ...form, status: "ACTIVE" as const } : form;
    try {
      await persistDraft(snapshot);
      router.push(`/${locale}/dashboard/admin/experiences`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const nextTab = tabs[currentIndex + 1];
    if (!nextTab) return;
    handleTabChange(nextTab.id);
  }

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    const firstSubstep = tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "";
    setOpenSectionId(firstSubstep);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleStepClick(tabId: string, substepId?: string) {
    setActiveTab(tabId);
    setOpenSectionId(substepId ?? tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "");
  }

  const navTabs = tabs.map((t) => ({ id: t.id, label: t.label }));
  const completedTabIds = useMemo(
    () => tabs.filter((t) => isXsedTabComplete(t.id, form)).map((t) => t.id),
    [tabs, form],
  );

  const currentTab = tabs.find((t) => t.id === activeTab);
  const isLastTab = tabs[tabs.length - 1]?.id === activeTab;
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
        <div className={cn("flex flex-col gap-8 w-full", "lg:flex-row")}>
          <div className={cn("hidden", "lg:block lg:self-start lg:sticky lg:top-8")}>
            <JourneyProgressSidebar
              activeSubstepId={openSectionId}
              activeTab={activeTab}
              addonsComingSoonLabel=""
              completedTabIds={completedTabIds}
              onStepClick={handleStepClick}
              progressLabel={dict.nav.progress}
              tabs={tabs}
            />
          </div>

          <div className="flex-1 min-w-0">
            {currentTab && (
              <div className="flex flex-col gap-4">
                <Accordion
                  className="flex flex-col gap-4"
                  collapsible
                  onValueChange={setOpenSectionId}
                  type="single"
                  value={openSectionId}
                >
                  {currentTab.substeps.map((substep) => (
                    <JourneyDropdown
                      content=""
                      key={substep.id}
                      label={substep.title}
                      value={substep.id}
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
                  <div className="bg-red-50 border border-red-200 flex gap-3 items-start px-4 py-3 rounded-xl">
                    <AlertCircle className="h-4 mt-0.5 shrink-0 text-red-500 w-4" />
                    <p className="text-red-800 text-sm">{saveError}</p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute bottom-3 left-0">
                    <XsedSaveIndicator
                      labels={{
                        error: dict.saveError,
                        saved: dict.saved,
                        saving: dict.saving,
                      }}
                      status={saveStatus}
                    />
                  </div>

                  <JourneyActionBar
                    canContinue={isXsedTabComplete(activeTab, form)}
                    canFinalize={canPublishXsedDrop(form)}
                    isAllStepsComplete={isLastTab}
                    isSavingAndRedirecting={isSubmitting}
                    labels={{
                      clearAll: dict.actionBar.clearAll,
                      next: dict.actionBar.next,
                      processingCheckout: dict.saving,
                      viewCheckout: finalizeCopy.submitLabel,
                    }}
                    onClearAll={() => setForm(EMPTY_XSED_DRAFT)}
                    onContinue={handleNext}
                    onGoToCheckout={handleRequestSubmit}
                    showClearAll={hasValues}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        cancelLabel={dict.cancel}
        confirmLabel={finalizeCopy.submitLabel}
        description={finalizeCopy.confirmBody}
        icon={Check}
        isConfirming={isSubmitting}
        onConfirm={() => void handleConfirmSubmit()}
        onOpenChange={setShowConfirm}
        open={showConfirm}
        title={finalizeCopy.confirmTitle}
        tone="neutral"
      />
    </div>
  );
}
