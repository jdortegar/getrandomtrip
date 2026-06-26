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
import { XsedDatesStep } from "./steps/XsedDatesStep";
import { XsedLocationStep } from "./steps/XsedLocationStep";
import { XsedRevealStep } from "./steps/XsedRevealStep";
import { XsedPoliciesStep } from "./steps/XsedPoliciesStep";
import { XsedAccommodationStep } from "./steps/XsedAccommodationStep";
import { XsedActivitiesStep } from "./steps/XsedActivitiesStep";
import { XsedBenefitsStep } from "./steps/XsedBenefitsStep";
import { XsedNotesStep } from "./steps/XsedNotesStep";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface XsedDropShellProps {
  dict: AdminXsedDict["form"];
  locale: string;
  initialDraft?: XsedDropDraft;
  initialDraftId?: string;
}

const AUTOSAVE_DELAY_MS = 2000;
const SAVED_RESET_MS = 3000;

const XSED_TABS = [
  {
    id: "main",
    label: "General",
    substeps: [
      { id: "identity", title: "Identidad", description: "" },
      { id: "dates", title: "Fecha & Precio", description: "" },
    ],
  },
  {
    id: "destination",
    label: "Destino",
    substeps: [{ id: "location", title: "Ubicación", description: "" }],
  },
  {
    id: "content",
    label: "Contenido",
    substeps: [
      { id: "reveal", title: "Reveal", description: "" },
      { id: "policies", title: "Políticas", description: "" },
      { id: "accommodation", title: "Alojamiento", description: "" },
      { id: "activities", title: "Actividades", description: "" },
    ],
  },
  {
    id: "logistics",
    label: "Logística",
    substeps: [
      { id: "benefits", title: "Beneficios & WhatsApp", description: "" },
    ],
  },
  {
    id: "internal",
    label: "Interno",
    substeps: [{ id: "notes", title: "Notas", description: "" }],
  },
];

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
      return !!(form.titleInternal.trim() && form.tripDate);
    case "destination":
      return !!(form.destinationCity.trim() && form.destinationCountry.trim());
    default:
      return true;
  }
}

function resolveXsedStepContent(
  activeTab: string,
  substepId: string,
  form: XsedDropDraft,
  onChange: (patch: Partial<XsedDropDraft>) => void,
): React.ReactNode {
  if (activeTab === "main") {
    if (substepId === "identity")
      return <XsedIdentityStep form={form} onChange={onChange} />;
    if (substepId === "dates")
      return <XsedDatesStep form={form} onChange={onChange} />;
  }
  if (activeTab === "destination") {
    if (substepId === "location")
      return <XsedLocationStep form={form} onChange={onChange} />;
  }
  if (activeTab === "content") {
    if (substepId === "reveal")
      return <XsedRevealStep form={form} onChange={onChange} />;
    if (substepId === "policies")
      return <XsedPoliciesStep form={form} onChange={onChange} />;
    if (substepId === "accommodation")
      return <XsedAccommodationStep form={form} onChange={onChange} />;
    if (substepId === "activities")
      return <XsedActivitiesStep form={form} onChange={onChange} />;
  }
  if (activeTab === "logistics") {
    if (substepId === "benefits")
      return <XsedBenefitsStep form={form} onChange={onChange} />;
  }
  if (activeTab === "internal") {
    if (substepId === "notes")
      return <XsedNotesStep form={form} onChange={onChange} />;
  }
  return null;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved" && <Check className="h-3 w-3 text-green-500" />}
      {status === "error" && <AlertCircle className="h-3 w-3 text-red-400" />}
      <span>
        {status === "saving" && "Guardando..."}
        {status === "saved" && "Guardado"}
        {status === "error" && "Error al guardar"}
      </span>
    </div>
  );
}

export function XsedDropShell({
  locale,
  initialDraft,
  initialDraftId,
}: XsedDropShellProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(XSED_TABS[0]?.id ?? "main");
  const [openSectionId, setOpenSectionId] = useState(
    XSED_TABS[0]?.substeps[0]?.id ?? "",
  );
  const [form, setForm] = useState<XsedDropDraft>(
    initialDraft ?? EMPTY_XSED_DRAFT,
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
    const currentIndex = XSED_TABS.findIndex((t) => t.id === activeTab);
    const nextTab = XSED_TABS[currentIndex + 1];
    if (!nextTab) return;
    handleTabChange(nextTab.id);
  }

  function canNavigateTo(targetTabId: string): boolean {
    const targetIndex = XSED_TABS.findIndex((t) => t.id === targetTabId);
    const currentIndex = XSED_TABS.findIndex((t) => t.id === activeTab);
    if (targetIndex <= currentIndex) return true;
    for (let i = 0; i < targetIndex; i++) {
      if (!isXsedTabComplete(XSED_TABS[i]!.id, form)) return false;
    }
    return true;
  }

  function handleTabChange(tabId: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    const firstSubstep =
      XSED_TABS.find((t) => t.id === tabId)?.substeps[0]?.id ?? "";
    setOpenSectionId(firstSubstep);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleStepClick(tabId: string, substepId?: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    setOpenSectionId(
      substepId ??
        XSED_TABS.find((t) => t.id === tabId)?.substeps[0]?.id ??
        "",
    );
  }

  const navTabs = XSED_TABS.map((t) => ({ id: t.id, label: t.label }));
  const completedTabIds = useMemo(
    () =>
      XSED_TABS.filter((t) => isXsedTabComplete(t.id, form)).map((t) => t.id),
    [form],
  );

  const currentTab = XSED_TABS.find((t) => t.id === activeTab);
  const isLastTab = XSED_TABS[XSED_TABS.length - 1]?.id === activeTab;
  const allTabsComplete = XSED_TABS.every((t) => isXsedTabComplete(t.id, form));
  const hasValues = !!(form.titleInternal || form.teaser);

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
              progressLabel="Progreso"
              onStepClick={handleStepClick}
              tabs={XSED_TABS}
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
                    <SaveIndicator status={saveStatus} />
                  </div>

                  <JourneyActionBar
                    canContinue={isXsedTabComplete(activeTab, form)}
                    isAllStepsComplete={isLastTab && allTabsComplete}
                    isSavingAndRedirecting={isSubmitting}
                    labels={{
                      clearAll: "Limpiar",
                      next: "Siguiente",
                      viewCheckout: "Guardar drop",
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
