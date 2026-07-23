"use client";

import { useRef, useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, CheckCircle2, X } from "lucide-react";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Modal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Modal";
import { ExperienceFormContent } from "./ExperienceFormContent";
import { ReviewActionsBar } from "./ReviewActionsBar";
import type { ExperienceFormDraft } from "@/types/tripper";
import { isExperienceTabComplete } from "@/lib/helpers/experience-form";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";
import {
  canRequestSubmit,
  isEditingExisting as computeIsEditingExisting,
  isEditingLiveRandomtrip as computeIsEditingLiveRandomtrip,
  resolveFinalizeCopy,
  resolvePublishRedirectPath,
  shouldShowTripperNoteField,
  type FinalizeCopy,
} from "./newExperienceShellHelpers";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface ExperienceImageState {
  onHeroSelect: (file: File) => void;
  onHeroRemove: () => void;
  onEntryImageSelect: (field: "activities" | "itinerary", index: number, file: File) => void;
  onEntryImageRemove: (field: "activities" | "itinerary", index: number) => void;
}

export type ExperienceShellMode =
  | "tripper"
  | "adminCreate"
  | "adminEdit"
  | "adminReadOnly";

interface NewExperienceShellProps {
  adminReviewSlot?: ReactNode;
  /** Renders approve/reject actions in the form action area without adding the Admin tab. */
  reviewActionsSlot?: ReactNode;
  /** Left side of the sticky review bar when there are no changed fields to show (e.g. tripper's note to admin). */
  reviewLeftSlot?: ReactNode;
  dict: TripperExperiencesDict["form"];
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  initialDraft?: ExperienceFormDraft;
  initialDraftId?: string;
  /** Controls editability and autosave routing. Defaults to 'tripper'. */
  mode?: ExperienceShellMode;
  /** ID of the review copy; required when mode === 'adminEdit'. Autosave patches this ID. */
  adminCopyId?: string;
  /** Changed fields list; when provided, highlights those fields in the form. */
  changedFields?: string[];
  /** Tripper's pristine original draft; enables the per-field peek toggle in `adminReadOnly` mode. */
  originalDraft?: ExperienceFormDraft;
  /** Overrides the finalize CTA label + confirm-modal copy (e.g. adminCreate's "Publish"). Falls back to tripper defaults. */
  finalizeCopy?: FinalizeCopy;
  /** Confirm-modal copy used instead of `finalizeCopy` when editing an already-live RANDOMTRIP row (see isEditingLiveRandomtrip) — CTA label stays dict.editSubmit ("Save Changes"). */
  editModeCopy?: { confirmTitle: string; confirmBody: string };
}

const EMPTY_DRAFT: ExperienceFormDraft = {
  status: "DRAFT",
  title: "",
  type: ["couple"],
  level: "essenza",
  teaser: "",
  description: "",
  heroImage: "",
  tags: [],
  destinationCountry: "",
  destinationCity: "",
  excuseKey: [],
  climate: "any",
  minPax: 1,
  maxPax: 1,
  minNights: 1,
  maxNights: 2,
  pricingByType: null,
  reviewNote: null,
  tripperNote: null,
  estimatedCost: "",
  season: [],
  transport: "any",
  travelTime: "",
  maxTravelTime: "no-limit",
  departPref: "any",
  arrivePref: "any",
  accommodationType: "any",
  accommodations: [
    { hotelName: "", hotelStars: "", hotelLocation: "", hotelDays: "", hotelLink: "", referredLink: "" },
  ],
  activities: [{ name: "", durationRhythm: null, description: "", risks: "", image: null }],
  itinerary: [{ title: "", description: "", image: null }],
  inclusions: [],
  exclusions: [],
  createBlogPost: false,
};

const AUTOSAVE_DELAY_MS = 2000;

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("feature", "experience");
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("upload failed");
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("no url");
  return data.url;
}

/** Tabs where isExperienceTabComplete() is vacuously true (no required fields) — see NewExperienceShell's completedTabIds. */
const OPTIONAL_TABS_REQUIRE_VISIT = new Set(["logistics"]);

const ADMIN_TAB: { id: string; label: string; substeps: { description: string; id: string; title: string }[] } = {
  id: "admin-review",
  label: "Admin",
  substeps: [
    { id: "admin-pricing", title: "Pricing & approval", description: "" },
  ],
};

export function NewExperienceShell({
  adminReviewSlot,
  reviewActionsSlot,
  reviewLeftSlot,
  dict,
  locale,
  userBadgeLabels,
  initialDraft,
  initialDraftId,
  mode = "tripper",
  adminCopyId,
  changedFields,
  originalDraft,
  finalizeCopy,
  editModeCopy,
}: NewExperienceShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabs = dict.contentTabs;
  const effectiveTabs = adminReviewSlot ? [...tabs, ADMIN_TAB] : tabs;

  // Resolve initial tab+section from URL, validating existence and guard
  const rawTab = searchParams.get("tab");
  const rawSection = searchParams.get("section");
  const seed = initialDraft ?? EMPTY_DRAFT;
  const tabIndex = rawTab ? effectiveTabs.findIndex((t) => t.id === rawTab) : -1;
  let resolvedTabId = tabs[0]?.id ?? "about";
  if (tabIndex !== -1) {
    const canReach =
      !!adminReviewSlot ||
      !!reviewActionsSlot ||
      Array.from({ length: tabIndex }, (_, i) => i).every((i) =>
        isExperienceTabComplete(effectiveTabs[i]!.id, seed),
      );
    if (canReach) resolvedTabId = rawTab!;
  }
  const resolvedTab = effectiveTabs.find((t) => t.id === resolvedTabId);
  const resolvedSection =
    (rawSection && resolvedTab?.substeps.some((s) => s.id === rawSection)
      ? rawSection
      : null) ?? resolvedTab?.substeps[0]?.id ?? "";

  const [activeTab, setActiveTab] = useState(resolvedTabId);
  const [openSectionId, setOpenSectionId] = useState(resolvedSection);
  // Tabs the user has actually opened — some tabs (e.g. logistics) have no
  // required fields, so isExperienceTabComplete() is vacuously true for them
  // from the start. Gate the "completed" checkmark on visitation too, so an
  // untouched optional step doesn't show as done before the user opens it.
  // Editing an existing draft means the tripper already went through the
  // whole flow once — a blank optional step there was a deliberate final
  // choice, not "not started" — so treat every tab as visited already.
  const [visitedTabIds, setVisitedTabIds] = useState<Set<string>>(() =>
    initialDraft
      ? new Set(effectiveTabs.map((t) => t.id))
      : new Set([resolvedTabId]),
  );
  const [form, setForm] = useState<ExperienceFormDraft>(
    initialDraft ?? EMPTY_DRAFT,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitNote, setSubmitNote] = useState("");

  // Derived read-only flag — controlled by mode, not status.
  // 'tripper': editable except when status is PENDING_REVIEW.
  // 'adminEdit': always editable (admin editing the copy).
  // 'adminReadOnly': always read-only (tripper reviewing proposed changes).
  const isReadOnly =
    mode === "adminReadOnly" ||
    (mode === "tripper" && (form.status === "PENDING_REVIEW" || form.status === "PENDING_TRIPPER_REVIEW"));

  // Editing an already-published RANDOMTRIP row (adminCreate mode, status !== DRAFT):
  // there is no staging/review copy for this flow, so autosave must not silently
  // patch the live public row on every keystroke. Edits are only persisted on an
  // explicit "Save Changes" click instead of the debounced autosave loop.
  const isEditingLiveRandomtrip = computeIsEditingLiveRandomtrip(mode, form.status);

  // Autosave is for the "new" creation flow only — any page opened against an
  // existing row (tripper's own edit page, admin's RANDOMTRIP edit page) turns
  // it off entirely, regardless of status, so edits only persist on an explicit
  // finalize/save click. adminEdit (review-copy editing) is a different, nested
  // flow and keeps its own always-on autosave.
  const isEditingExisting = computeIsEditingExisting(mode, !!initialDraftId);

  // Blob URL → File map for pending uploads (blob URLs live in form state directly)
  const pendingFilesRef = useRef<Map<string, File>>(new Map());

  const draftIdRef = useRef<string | null>(initialDraftId ?? null);
  const isFirstRender = useRef(true);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Upload all pending blob URLs in a snapshot. On success: replace blob with real URL
  // in both the snapshot (for the API call) and form state. On failure: strip from
  // the snapshot only — form state keeps the blob so the preview persists and retries.
  const flushPendingBlobs = useCallback(
    async (snapshot: ExperienceFormDraft): Promise<ExperienceFormDraft> => {
      let result = { ...snapshot };

      // Hero
      if (result.heroImage.startsWith("blob:")) {
        const file = pendingFilesRef.current.get(result.heroImage);
        const blobUrl = result.heroImage;
        if (file) {
          try {
            const url = await uploadImageFile(file);
            pendingFilesRef.current.delete(blobUrl);
            URL.revokeObjectURL(blobUrl);
            result = { ...result, heroImage: url };
            setForm((prev) =>
              prev.heroImage === blobUrl ? { ...prev, heroImage: url } : prev,
            );
          } catch {
            result = { ...result, heroImage: "" }; // strip from API only
          }
        } else {
          result = { ...result, heroImage: "" };
        }
      }

      // Per-entry images: activities
      const flushedActivities = await Promise.all(
        result.activities.map(async (entry, index) => {
          if (!entry.image?.startsWith("blob:")) return entry;
          const blobUrl = entry.image;
          const file = pendingFilesRef.current.get(blobUrl);
          if (!file) return { ...entry, image: null };
          try {
            const url = await uploadImageFile(file);
            pendingFilesRef.current.delete(blobUrl);
            URL.revokeObjectURL(blobUrl);
            setForm((prev) => {
              const updated = [...prev.activities];
              if (updated[index]?.image === blobUrl) {
                updated[index] = { ...updated[index]!, image: url };
              }
              return { ...prev, activities: updated };
            });
            return { ...entry, image: url };
          } catch {
            return { ...entry, image: null };
          }
        }),
      );
      result = { ...result, activities: flushedActivities };

      // Per-entry images: itinerary
      const flushedItinerary = await Promise.all(
        result.itinerary.map(async (day, index) => {
          if (!day.image?.startsWith("blob:")) return day;
          const blobUrl = day.image;
          const file = pendingFilesRef.current.get(blobUrl);
          if (!file) return { ...day, image: null };
          try {
            const url = await uploadImageFile(file);
            pendingFilesRef.current.delete(blobUrl);
            URL.revokeObjectURL(blobUrl);
            setForm((prev) => {
              const updated = [...prev.itinerary];
              if (updated[index]?.image === blobUrl) {
                updated[index] = { ...updated[index]!, image: url };
              }
              return { ...prev, itinerary: updated };
            });
            return { ...day, image: url };
          } catch {
            return { ...day, image: null };
          }
        }),
      );
      result = { ...result, itinerary: flushedItinerary };

      return result;
    },
    [],
  );

  const persistDraft = useCallback(
    async (snapshot: ExperienceFormDraft) => {
      if (isReadOnly) return; // no autosave in read-only modes
      setSaveStatus("saving");
      try {
        const finalSnapshot = await flushPendingBlobs(snapshot);
        if (mode === "adminEdit" && adminCopyId) {
          // Admin editing a review copy — dedicated endpoint, no ownership check
          const res = await fetch(
            `/api/admin/experiences/${adminCopyId}/edit-copy`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(finalSnapshot),
            },
          );
          if (!res.ok) throw new Error();
        } else if (!draftIdRef.current) {
          const res = await fetch("/api/tripper/experiences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalSnapshot),
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
              body: JSON.stringify(finalSnapshot),
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
    },
    [flushPendingBlobs, mode, adminCopyId],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isReadOnly) return; // no autosave while pending review
    if (isEditingExisting) return; // editing an existing row — only an explicit finalize/save click persists
    if (!draftIdRef.current && !form.title.trim()) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => persistDraft(form), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [form, persistDraft, isReadOnly, isEditingExisting]);

  // Keep URL in sync with active tab+section so reloads restore position
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    params.set("section", openSectionId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [activeTab, openSectionId, router]);

  function canNavigateTo(targetTabId: string): boolean {
    if (adminReviewSlot || reviewActionsSlot) return true;
    const targetIndex = effectiveTabs.findIndex((t) => t.id === targetTabId);
    const currentIndex = effectiveTabs.findIndex((t) => t.id === activeTab);
    if (targetIndex <= currentIndex) return true;
    for (let i = 0; i < targetIndex; i++) {
      if (!isExperienceTabComplete(effectiveTabs[i]!.id, form)) return false;
    }
    return true;
  }

  function handleTabChange(tabId: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    setVisitedTabIds((prev) => new Set(prev).add(tabId));
    const firstSubstep =
      effectiveTabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "";
    setOpenSectionId(firstSubstep);
    // Deferred like handleSectionChange — scrolling synchronously targets the
    // pre-accordion-animation layout, then the section's expand/collapse
    // transition shifts the page under the user right after landing.
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  function handleBackToStart() {
    const firstTab = effectiveTabs[0];
    if (firstTab) handleTabChange(firstTab.id);
  }

  function handleStepClick(tabId: string, substepId?: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    setVisitedTabIds((prev) => new Set(prev).add(tabId));
    setOpenSectionId(
      substepId ?? effectiveTabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "",
    );
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  function handleSectionChange(sectionId: string) {
    setOpenSectionId(sectionId);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  function handleNext() {
    const currentIndex = effectiveTabs.findIndex((t) => t.id === activeTab);
    const nextTab = effectiveTabs[currentIndex + 1];
    if (nextTab) handleTabChange(nextTab.id);
  }

  function handlePreviousStep() {
    const currentIndex = effectiveTabs.findIndex((t) => t.id === activeTab);
    const prevTab = effectiveTabs[currentIndex - 1];
    if (prevTab) handleTabChange(prevTab.id);
  }

  function handleClearAll() {
    setForm(EMPTY_DRAFT);
  }

  const canFinalize = canRequestSubmit(mode, isSubmitting, isReadOnly, form.status);
  const canSaveChanges = isEditingLiveRandomtrip && !isSubmitting && !isReadOnly;

  function handleRequestSubmit() {
    if (!canFinalize && !canSaveChanges) return;
    setSubmitNote(form.tripperNote ?? "");
    setShowSubmitConfirm(true);
  }

  async function confirmSubmit() {
    setShowSubmitConfirm(false);
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitFailed(false);
    setForm((prev) => ({ ...prev, tripperNote: submitNote }));
    try {
      const finalForm = await flushPendingBlobs({ ...form, tripperNote: submitNote });

      // Ensure the draft is persisted first (create if new, update if existing)
      if (!draftIdRef.current) {
        const res = await fetch("/api/tripper/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalForm),
        });
        if (!res.ok) throw new Error("Failed to create draft");
        const data = (await res.json()) as { id: string };
        draftIdRef.current = data.id;
      } else {
        const res = await fetch(
          `/api/tripper/experiences/${draftIdRef.current}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalForm),
          },
        );
        if (!res.ok) throw new Error("Failed to save draft");
      }

      // Editing an already-live RANDOMTRIP row: the PATCH above already
      // persisted the changes. There is no PENDING_REVIEW step to enter —
      // /submit would 409 since the row isn't DRAFT — so this IS the save
      // action; skip straight to the redirect.
      if (isEditingLiveRandomtrip) {
        router.push(resolvePublishRedirectPath(mode, locale));
        return;
      }

      // Submit for review
      const submitRes = await fetch(
        `/api/tripper/experiences/${draftIdRef.current}/submit`,
        { method: "POST" },
      );

      if (!submitRes.ok) {
        const body = (await submitRes.json()) as { error?: string; missing?: string[] };
        if (submitRes.status === 422 && body.missing) {
          setSubmitError(body.missing);
          setIsSubmitting(false);
          return;
        }
        throw new Error(body.error ?? "Submit failed");
      }

      if (finalForm.createBlogPost) {
        try {
          await fetch("/api/tripper/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: finalForm.title,
              subtitle: finalForm.teaser || null,
              content: finalForm.description || null,
              coverUrl: finalForm.heroImage || null,
              tags: finalForm.tags,
              travelType: finalForm.type || null,
              excuseKey: finalForm.excuseKey[0] ?? null,
              status: "draft",
              format: "article",
            }),
          });
        } catch {
          // non-fatal
        }
      }

      // Stay in the loading state through navigation — router.push doesn't
      // synchronously unmount this component, so resetting isSubmitting here
      // would flash the button back to its idle label for a moment first.
      router.push(resolvePublishRedirectPath(mode, locale));
    } catch (err) {
      console.error(err);
      setSubmitFailed(true);
      setIsSubmitting(false);
    }
  }

  function handleChange<K extends keyof ExperienceFormDraft>(
    key: K,
    value: ExperienceFormDraft[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleHeroSelect(file: File) {
    const blobUrl = URL.createObjectURL(file);
    pendingFilesRef.current.set(blobUrl, file);
    setForm((prev) => ({ ...prev, heroImage: blobUrl }));
  }

  function handleHeroRemove() {
    if (form.heroImage.startsWith("blob:")) {
      pendingFilesRef.current.delete(form.heroImage);
      URL.revokeObjectURL(form.heroImage);
    }
    setForm((prev) => ({ ...prev, heroImage: "" }));
  }

  function handleEntryImageSelect(field: "activities" | "itinerary", index: number, file: File) {
    const blobUrl = URL.createObjectURL(file);
    pendingFilesRef.current.set(blobUrl, file);
    setForm((prev) => {
      const updated = [...prev[field]] as typeof prev[typeof field];
      updated[index] = { ...updated[index]!, image: blobUrl };
      return { ...prev, [field]: updated };
    });
  }

  function handleEntryImageRemove(field: "activities" | "itinerary", index: number) {
    setForm((prev) => {
      const updated = [...prev[field]] as typeof prev[typeof field];
      const entry = updated[index];
      if (entry?.image?.startsWith("blob:")) {
        pendingFilesRef.current.delete(entry.image);
        URL.revokeObjectURL(entry.image);
      }
      updated[index] = { ...entry!, image: null };
      return { ...prev, [field]: updated };
    });
  }

  const imageState: ExperienceImageState = {
    onHeroSelect: handleHeroSelect,
    onHeroRemove: handleHeroRemove,
    onEntryImageSelect: handleEntryImageSelect,
    onEntryImageRemove: handleEntryImageRemove,
  };

  const navTabs = effectiveTabs.map((t) => ({ id: t.id, label: t.label }));
  const completedTabIds = useMemo(
    () =>
      effectiveTabs
        .filter((t) => {
          if (t.id === "admin-review") return false;
          if (!isExperienceTabComplete(t.id, form)) return false;
          // Tabs with no required fields (e.g. logistics) are always
          // "complete" for navigation-gating purposes, but that shouldn't
          // draw a checkmark before the user has actually opened them.
          if (OPTIONAL_TABS_REQUIRE_VISIT.has(t.id)) {
            return visitedTabIds.has(t.id);
          }
          return true;
        })
        .map((t) => t.id),
    [effectiveTabs, form, visitedTabIds],
  );

  // Review-note banner: rejection note (DRAFT) or approval note (ACTIVE), shown until dismissed.
  // Tripper's own view only — reviewActionsSlot contexts (admin review, review-copy) already
  // surface the note in the sticky bar's leftSlot, so this would just duplicate it.
  const showReviewNoteBanner =
    mode === "tripper" &&
    !!form.reviewNote &&
    !bannerDismissed &&
    (form.status === "DRAFT" || form.status === "ACTIVE");
  const isRejectionNote = form.status === "DRAFT";

  // Finalize CTA label + confirm-modal copy — falls back to the tripper
  // defaults unless an override (e.g. adminCreate's "Publish") is passed.
  // Editing an already-live RANDOMTRIP row swaps in "Save Changes" copy
  // instead — there is nothing left to "publish".
  const resolvedFinalizeCopy =
    isEditingLiveRandomtrip && editModeCopy
      ? {
          submitLabel: dict.editSubmit,
          confirmTitle: editModeCopy.confirmTitle,
          confirmBody: editModeCopy.confirmBody,
        }
      : resolveFinalizeCopy(dict, finalizeCopy);
  const effectiveDict = finalizeCopy
    ? {
        ...dict,
        actionBar: {
          ...dict.actionBar,
          submitForReview: resolvedFinalizeCopy.submitLabel,
        },
      }
    : dict;
  const showTripperNoteField = shouldShowTripperNoteField(mode);

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

      {reviewActionsSlot && (
        <ReviewActionsBar
          changedFields={changedFields ?? []}
          changedFieldsLabel={dict.changedFieldsBanner.prefix}
          actionsSlot={reviewActionsSlot}
          leftSlot={reviewLeftSlot}
        />
      )}

      <div className="rt-container py-4 sm:py-8 scroll-mt-20" ref={contentRef}>
        {/* Rejection / approval note banner */}
        {showReviewNoteBanner && (
          <div
            className={cn(
              "mb-6 flex items-start gap-3 rounded-xl border px-4 py-3",
              isRejectionNote
                ? "border-amber-200 bg-amber-50"
                : "border-green-200 bg-green-50",
            )}
          >
            {isRejectionNote ? (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
            )}
            <div
              className={cn(
                "flex-1 text-sm",
                isRejectionNote ? "text-amber-800" : "text-green-800",
              )}
            >
              <p className="font-medium mb-1">
                {isRejectionNote
                  ? dict.review.rejectedTitle
                  : dict.review.approvedNoteTitle}
              </p>
              <p>{form.reviewNote}</p>
            </div>
            <button
              type="button"
              className={cn(
                "ml-auto shrink-0",
                isRejectionNote
                  ? "text-amber-500 hover:text-amber-700"
                  : "text-green-500 hover:text-green-700",
              )}
              onClick={() => setBannerDismissed(true)}
              aria-label={dict.review.rejectedDismiss}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Submit error banner — missing required fields (422) */}
        {submitError && submitError.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
            <div className="text-sm text-red-800">
              <span className="font-medium">{dict.requiredFieldsLabel}: </span>
              {submitError.join(", ")}
            </div>
          </div>
        )}

        {/* Submit error banner — generic failure (network/500) */}
        {submitFailed && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
            <div className="text-sm text-red-800">{dict.errorSubmit}</div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row w-full gap-8">
          <div className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
            <JourneyProgressSidebar
              activeTab={activeTab}
              activeSubstepId={openSectionId}
              completedTabIds={completedTabIds}
              addonsComingSoonLabel=""
              progressLabel={dict.nav.progress}
              onStepClick={handleStepClick}
              tabs={effectiveTabs}
            />
          </div>

          <div className="min-w-0 flex-1">
            <ExperienceFormContent
              activeTab={activeTab}
              adminReviewSlot={adminReviewSlot}
              reviewActionsSlot={reviewActionsSlot}
              onBack={handleBackToStart}
              onPreviousStep={handlePreviousStep}
              copy={effectiveDict}
              form={form}
              imageState={imageState}
              isReadOnly={isReadOnly}
              isSubmitting={isSubmitting}
              saveStatus={saveStatus}
              onChange={handleChange}
              onClearAll={handleClearAll}
              onNext={handleNext}
              onSubmit={handleRequestSubmit}
              canFinalize={canFinalize || canSaveChanges}
              openSectionId={openSectionId}
              onSectionChange={handleSectionChange}
              tabs={effectiveTabs}
              changedFields={changedFields}
              originalDraft={originalDraft}
            />
          </div>
        </div>
      </div>

      <Modal
        open={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        showCloseButton
        className="max-w-md"
      >
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-light-blue/10">
            <Check className="h-5 w-5 text-light-blue" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {resolvedFinalizeCopy.confirmTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            {resolvedFinalizeCopy.confirmBody}
          </DialogDescription>
        </DialogHeader>
        {showTripperNoteField && (
          <div className="mt-2 flex flex-col gap-1.5">
            <label htmlFor="submit-note" className="text-sm font-medium text-gray-700">
              {dict.tripperNoteLabel}{" "}
              <span className="font-normal text-gray-400">{dict.tripperNoteOptional}</span>
            </label>
            <textarea
              id="submit-note"
              rows={3}
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              placeholder={dict.tripperNotePlaceholder}
              disabled={isSubmitting}
              className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:opacity-50"
            />
          </div>
        )}
        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowSubmitConfirm(false)}
            disabled={isSubmitting}
          >
            {dict.cancel}
          </Button>
          <Button onClick={() => void confirmSubmit()} disabled={isSubmitting}>
            {isSubmitting ? dict.saving : resolvedFinalizeCopy.submitLabel}
          </Button>
        </DialogFooter>
      </Modal>
    </div>
  );
}
