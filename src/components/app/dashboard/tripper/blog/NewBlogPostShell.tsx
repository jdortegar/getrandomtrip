"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Check } from "lucide-react";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { Button } from "@/components/ui/Button";
import {
  Modal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Modal";
import { BlogFormContent } from "./BlogFormContent";
import { BlogReviewActionsBar } from "./BlogReviewActionsBar";
import type { BlogFormDraft } from "@/types/blog";
import { buildBlogSubmitPayload, isBlogTabComplete } from "@/lib/helpers/blog-form";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import {
  isEditingExisting as computeIsEditingExisting,
  resolveBlogPersistTarget,
  shouldSkipAutosave,
  shouldSwapFooterForReviewActions,
  type BlogShellMode,
} from "./newBlogPostShellHelpers";

export type { BlogShellMode } from "./newBlogPostShellHelpers";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface BlogImageState {
  coverUploading: boolean;
  onCoverSelect: (file: File) => void;
  onCoverRemove: () => void;
  galleryUploading: boolean;
  onGalleryFilesSelect: (files: File[]) => void;
  onGalleryImageRemove: (index: number) => void;
}

interface NewBlogPostShellProps {
  dict: TripperBlogFormDict;
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  /** Seeds the form when editing an existing post; omitted when creating. */
  initialDraft?: BlogFormDraft;
  /** ID of the existing post; when set, autosave PATCHes instead of POSTing a new one. */
  initialDraftId?: string;
  /** Controls editability and autosave routing. Defaults to 'tripper'. */
  mode?: BlogShellMode;
  /** ID of the review copy; required when mode === 'adminEdit'. Autosave patches this ID. */
  adminCopyId?: string;
  /** Renders approve/reject/start-edit/send/discard actions in place of the footer nav (adminEdit/adminReadOnly only). */
  reviewActionsSlot?: ReactNode;
  /** Extra content shown above the form (e.g. the other party's note) when reviewActionsSlot is present. */
  reviewLeftSlot?: ReactNode;
  /** Fields changed by the admin's proposed copy; when provided, highlights those fields and enables the per-field peek toggle. */
  changedFields?: string[];
  /** Tripper's pristine original draft; enables the per-field peek toggle in `adminReadOnly` mode. */
  originalDraft?: BlogFormDraft;
}

const EMPTY_DRAFT: BlogFormDraft = {
  status: "draft",
  title: "",
  subtitle: "",
  coverUrl: "",
  featureText: "",
  featureAttribution: "",
  sections: [{ title: "", description: "" }],
  faq: [{ question: "", answer: "" }],
  gallery: [],
  tripperNote: null,
};

const AUTOSAVE_DELAY_MS = 2000;
const MAX_BLOG_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

// Tabs with no required fields are vacuously "complete" from the start —
// gate their checkmark on visitation too, mirroring NewExperienceShell's
// OPTIONAL_TABS_REQUIRE_VISIT for the "logistics" tab.
const OPTIONAL_TABS_REQUIRE_VISIT = new Set(["content", "faq", "gallery"]);

function validateFileSize(file: File): boolean {
  return file.size <= MAX_BLOG_IMAGE_BYTES;
}

async function uploadImageFile(file: File, feature: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("feature", feature);
  const response = await fetch("/api/upload", { method: "POST", body: formData });
  if (!response.ok) throw new Error("upload failed");
  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error("no url");
  return data.url;
}

async function deleteImageFile(url: string): Promise<void> {
  if (!url.includes("/api/upload?key=")) return;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[deleteImageFile] ${res.status} ${res.statusText}`, body, url);
  }
}

export function NewBlogPostShell({
  dict,
  locale,
  userBadgeLabels,
  initialDraft,
  initialDraftId,
  mode = "tripper",
  adminCopyId,
  reviewActionsSlot,
  reviewLeftSlot,
  changedFields,
  originalDraft,
}: NewBlogPostShellProps) {
  const router = useRouter();
  const tabs = dict.contentTabs;

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "general");
  const [openSectionId, setOpenSectionId] = useState(
    tabs[0]?.substeps[0]?.id ?? "",
  );
  // Editing an existing post means the tripper already went through the
  // whole flow once — mark every tab as visited so optional tabs (content,
  // faq, gallery) show their checkmark immediately instead of only after
  // being opened, mirroring NewExperienceShell's same convention.
  const [visitedTabIds, setVisitedTabIds] = useState<Set<string>>(() =>
    initialDraft ? new Set(tabs.map((t) => t.id)) : new Set([tabs[0]?.id ?? "general"]),
  );
  const [draft, setDraft] = useState<BlogFormDraft>(initialDraft ?? EMPTY_DRAFT);

  // Derived read-only flag — controlled by mode and status, mirrors
  // NewExperienceShell's isReadOnly exactly. 'tripper': editable except
  // while a decision is pending (PENDING_REVIEW awaiting the admin,
  // PENDING_TRIPPER_REVIEW awaiting the tripper's own copy decision —
  // that one is normally reached via the dedicated review-copy page, not
  // this edit page, but the guard applies defensively either way).
  // 'adminReadOnly': always read-only (tripper reviewing an admin's
  // proposed copy).
  const isReadOnly =
    mode === "adminReadOnly" ||
    (mode === "tripper" &&
      (draft.status === "pending_review" || draft.status === "pending_tripper_review"));

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isFinishing, setIsFinishing] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitNote, setSubmitNote] = useState("");
  const [submitError, setSubmitError] = useState<string[] | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);

  const draftIdRef = useRef<string | null>(initialDraftId ?? null);
  const isFirstRender = useRef(true);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave is for the "new" post flow only — opening an existing post
  // (tripper's own edit page) turns it off entirely; edits only persist on
  // an explicit "Finish" click, same as NewExperienceShell.
  const isEditingExisting = computeIsEditingExisting(mode, !!initialDraftId);
  const contentRef = useRef<HTMLDivElement>(null);

  const persistDraft = useCallback(
    async (snapshot: BlogFormDraft) => {
      setSaveStatus("saving");
      try {
        const payload = buildBlogSubmitPayload(snapshot);
        const target = resolveBlogPersistTarget(mode, adminCopyId, draftIdRef.current);
        if (target.kind === "adminEditCopy") {
          const res = await fetch(`/api/admin/blogs/${target.copyId}/edit-copy`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
        } else if (target.kind === "createDraft") {
          const res = await fetch("/api/tripper/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { blog: { id: string } };
          draftIdRef.current = data.blog.id;
        } else {
          const res = await fetch(`/api/tripper/blogs/${target.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
        }
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
      } catch {
        setSaveStatus("error");
        toast.error(dict.toasts.saveError);
      }
    },
    [dict.toasts.saveError, mode, adminCopyId],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (shouldSkipAutosave(mode)) return;
    if (isEditingExisting) return; // editing an existing post — only an explicit "Finish" click persists
    if (!draftIdRef.current && !draft.title.trim()) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => persistDraft(draft), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, persistDraft, mode, isEditingExisting]);

  function scrollToContent() {
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  function canNavigateTo(targetTabId: string): boolean {
    if (mode !== "tripper") return true;
    const targetIndex = tabs.findIndex((t) => t.id === targetTabId);
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (targetIndex <= currentIndex) return true;
    for (let i = 0; i < targetIndex; i++) {
      if (!isBlogTabComplete(tabs[i]!.id, draft)) return false;
    }
    return true;
  }

  function handleTabChange(tabId: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    setVisitedTabIds((prev) => new Set(prev).add(tabId));
    const firstSubstep = tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "";
    setOpenSectionId(firstSubstep);
    scrollToContent();
  }

  function handleStepClick(tabId: string, substepId?: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    setVisitedTabIds((prev) => new Set(prev).add(tabId));
    setOpenSectionId(substepId ?? tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "");
    scrollToContent();
  }

  function handleSectionChange(sectionId: string) {
    setOpenSectionId(sectionId);
    scrollToContent();
  }

  function handleNext() {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const nextTab = tabs[currentIndex + 1];
    if (nextTab) handleTabChange(nextTab.id);
  }

  function handlePreviousStep() {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const prevTab = tabs[currentIndex - 1];
    if (prevTab) handleTabChange(prevTab.id);
  }

  function handleClearAll() {
    setDraft(EMPTY_DRAFT);
  }

  // Submitting for review is the sole finalize action in the wizard, for
  // both a brand-new post and editing an existing DRAFT — mirrors
  // NewExperienceShell's tripper-mode finalize (always available regardless
  // of new/edit), no separate "just save as draft" path. Blocked while
  // read-only (status already PENDING_REVIEW/PENDING_TRIPPER_REVIEW) — the
  // submit route itself is DRAFT-only and would 409 otherwise.
  const canFinalize = mode === "tripper" && !isFinishing && !isReadOnly;

  function handleRequestSubmit() {
    if (!canFinalize) return;
    setSubmitNote(draft.tripperNote ?? "");
    setShowSubmitConfirm(true);
  }

  async function confirmSubmit() {
    setShowSubmitConfirm(false);
    setIsFinishing(true);
    setSubmitError(null);
    setSubmitFailed(false);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    const finalDraft = { ...draft, tripperNote: submitNote };
    setDraft(finalDraft);
    try {
      await persistDraft(finalDraft);
      if (!draftIdRef.current) throw new Error("Failed to save draft");

      const submitRes = await fetch(
        `/api/tripper/blogs/${draftIdRef.current}/submit`,
        { method: "POST" },
      );

      if (!submitRes.ok) {
        const body = (await submitRes.json()) as { error?: string; missing?: string[] };
        if (submitRes.status === 422 && body.missing) {
          setSubmitError(body.missing);
          setIsFinishing(false);
          return;
        }
        throw new Error(body.error ?? "Submit failed");
      }

      // Stay in the loading state through navigation — router.push doesn't
      // synchronously unmount this component, so resetting isFinishing here
      // would flash the button back to its idle label for a moment first.
      router.push(pathForLocale(locale as Locale, "/dashboard/tripper/blog"));
    } catch (err) {
      console.error(err);
      setSubmitFailed(true);
      setIsFinishing(false);
    }
  }

  function handleChange<K extends keyof BlogFormDraft>(key: K, value: BlogFormDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCoverSelect(file: File) {
    if (!validateFileSize(file)) {
      toast.error(dict.toasts.fileTooLarge);
      return;
    }
    setCoverUploading(true);
    try {
      const oldCover = draft.coverUrl;
      const url = await uploadImageFile(file, "blog-cover");
      setDraft((prev) => ({ ...prev, coverUrl: url }));
      if (oldCover) await deleteImageFile(oldCover).catch(() => null);
    } catch {
      toast.error(dict.toasts.uploadError);
    } finally {
      setCoverUploading(false);
    }
  }

  function handleCoverRemove() {
    const old = draft.coverUrl;
    setDraft((prev) => ({ ...prev, coverUrl: "" }));
    if (old) void deleteImageFile(old).catch(() => null);
  }

  async function handleGalleryFilesSelect(files: File[]) {
    const oversized = files.filter((f) => !validateFileSize(f));
    if (oversized.length > 0) {
      toast.error(dict.toasts.fileTooLarge);
      return;
    }
    setGalleryUploading(true);
    try {
      const results = await Promise.allSettled(
        files.map((f) => uploadImageFile(f, "blog-gallery")),
      );
      const urls: string[] = [];
      let failCount = 0;
      for (const result of results) {
        if (result.status === "fulfilled") urls.push(result.value);
        else failCount++;
      }
      if (failCount > 0) toast.error(dict.toasts.uploadError);
      if (urls.length > 0) {
        setDraft((prev) => ({ ...prev, gallery: [...prev.gallery, ...urls] }));
      }
    } finally {
      setGalleryUploading(false);
    }
  }

  function handleGalleryImageRemove(index: number) {
    const url = draft.gallery[index];
    setDraft((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
    if (url) void deleteImageFile(url).catch(() => null);
  }

  const imageState: BlogImageState = {
    coverUploading,
    onCoverSelect: handleCoverSelect,
    onCoverRemove: handleCoverRemove,
    galleryUploading,
    onGalleryFilesSelect: handleGalleryFilesSelect,
    onGalleryImageRemove: handleGalleryImageRemove,
  };

  const navTabs = tabs.map((t) => ({ id: t.id, label: t.label }));
  const completedTabIds = useMemo(
    () =>
      tabs
        .filter((t) => {
          if (!isBlogTabComplete(t.id, draft)) return false;
          if (OPTIONAL_TABS_REQUIRE_VISIT.has(t.id)) return visitedTabIds.has(t.id);
          return true;
        })
        .map((t) => t.id),
    [tabs, draft, visitedTabIds],
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

      {reviewActionsSlot && (
        <BlogReviewActionsBar
          changedFields={changedFields ?? []}
          changedFieldsLabel={dict.changedFieldsBanner.prefix}
          actionsSlot={reviewActionsSlot}
          leftSlot={reviewLeftSlot}
        />
      )}

      <div className="rt-container py-4 sm:py-8 scroll-mt-20" ref={contentRef}>
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
              tabs={tabs}
            />
          </div>

          <div className="min-w-0 flex-1">
            <BlogFormContent
              activeTab={activeTab}
              copy={dict}
              draft={draft}
              imageState={imageState}
              isFinishing={isFinishing}
              saveStatus={saveStatus}
              onChange={handleChange}
              onClearAll={handleClearAll}
              onNext={handleNext}
              onPreviousStep={handlePreviousStep}
              onFinish={handleRequestSubmit}
              openSectionId={openSectionId}
              onSectionChange={handleSectionChange}
              tabs={tabs}
              readOnly={isReadOnly}
              reviewActionsSlot={
                shouldSwapFooterForReviewActions(mode) ? reviewActionsSlot : undefined
              }
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
            {dict.submitConfirmTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            {dict.submitConfirmBody}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-1.5">
          <label htmlFor="blog-submit-note" className="text-sm font-medium text-gray-700">
            {dict.tripperNoteLabel}{" "}
            <span className="font-normal text-gray-400">{dict.tripperNoteOptional}</span>
          </label>
          <textarea
            id="blog-submit-note"
            rows={3}
            value={submitNote}
            onChange={(e) => setSubmitNote(e.target.value)}
            placeholder={dict.tripperNotePlaceholder}
            disabled={isFinishing}
            className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:opacity-50"
          />
          <p className="text-xs text-neutral-400">{dict.tripperNoteHint}</p>
        </div>
        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowSubmitConfirm(false)}
            disabled={isFinishing}
          >
            {dict.cancel}
          </Button>
          <Button onClick={() => void confirmSubmit()} disabled={isFinishing}>
            {isFinishing ? dict.saving : dict.actionBar.submitForReview}
          </Button>
        </DialogFooter>
      </Modal>
    </div>
  );
}
