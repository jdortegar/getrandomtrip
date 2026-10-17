"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { BlogContentLanguage } from "./BlogContentLanguage";
import { BlogFormContent } from "./BlogFormContent";
import { BlogEditorLocaleTools } from "./BlogEditorLocaleTools";
import { BlogReviewActionsBar } from "./BlogReviewActionsBar";
import { BlogSubmitConfirmModal } from "./BlogSubmitConfirmModal";
import { useBlogEditorImages } from "./useBlogEditorImages";
import {
  messageForEditorWriteError,
  persistBlogEditorDraft,
} from "./persistBlogEditorDraft";
import type { BlogEditorDraft, BlogFormDraft } from "@/types/blog";
import { findMediaMismatch } from "@/lib/blog/translation-completeness";
import { labelBlogChangedFields } from "@/lib/blog/label-changed-fields";
import { isContentLocale } from "@/lib/blog/locales";
import { resolveBlogChangedFieldsForLocale } from "@/lib/blog/blog-form-peek";
import {
  BLOG_LOCALIZED_DRAFT_FIELDS,
  coerceEditorDraft,
  emptyBlogEditorDraft,
  emptyBlogLocaleDraft,
  getBlogLocaleView,
  isBlogTabComplete,
  isBlogTabEligible,
  syncGalleryAcrossLocales,
} from "@/lib/helpers/blog-form";
import type { ContentLocale } from "@/types/blog";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";
import {
  isEditingExisting as computeIsEditingExisting,
  resolveBlogPersistTarget,
  resolveBlogPublishRedirectPath,
  resolveFinalizeCopy,
  shouldShowTripperNoteField,
  shouldSkipAutosave,
  shouldSwapFooterForReviewActions,
  type BlogShellMode,
  type FinalizeCopy,
} from "./newBlogPostShellHelpers";

export type { BlogShellMode } from "./newBlogPostShellHelpers";
export type { BlogImageState } from "./useBlogEditorImages";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface NewBlogPostShellProps {
  dict: TripperBlogFormDict;
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  /** Seeds the form when editing an existing post; omitted when creating. */
  initialDraft?: BlogEditorDraft;
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
  originalDraft?: BlogEditorDraft;
  /** True when the logged-in user has the admin role — independent of `mode`, since
   * (unlike experiences) there's no dedicated admin composer route for blogs; an
   * admin's own tripper-mode blog pages still need to show admin-only fields. */
  isAdmin?: boolean;
  /** Overrides the finalize CTA label + confirm-modal copy (e.g. adminCreate's "Publish"). Falls back to tripper defaults. */
  finalizeCopy?: FinalizeCopy;
  /** The post's ownership source (see BlogPost.source). Combined with `isAdmin` and
   * `initialDraft.status` to detect editing an already-live RANDOMTRIP post. */
  source?: "TRIPPER" | "RANDOMTRIP";
}

const AUTOSAVE_DELAY_MS = 2000;

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
  isAdmin: isAdminProp,
  finalizeCopy,
  source,
}: NewBlogPostShellProps) {
  const router = useRouter();
  const tabs = dict.contentTabs;

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "general");
  const [openSectionId, setOpenSectionId] = useState(
    tabs[0]?.substeps[0]?.id ?? "",
  );
  const contentGenerationRef = useRef(0);
  const contentGeneration = contentGenerationRef.current;
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const defaultSource = isContentLocale(locale) ? locale : "es";
  const [contentLocale, setContentLocale] = useState<ContentLocale>(
    initialDraftId ? "es" : defaultSource,
  );
  const contentLanguageRef = useRef<HTMLSelectElement>(null);
  const restoreLanguageFocusRef = useRef(false);
  const [draft, setDraft] = useState<BlogEditorDraft>(() =>
    initialDraft
      ? coerceEditorDraft(initialDraft, defaultSource)
      : emptyBlogEditorDraft(defaultSource),
  );

  useLayoutEffect(() => {
    if (restoreLanguageFocusRef.current) {
      contentLanguageRef.current?.focus({ preventScroll: true });
      restoreLanguageFocusRef.current = false;
    }
  }, [contentLocale]);

  const displayedDraft = getBlogLocaleView(draft, contentLocale);
  const displayedOriginal = originalDraft && getBlogLocaleView(originalDraft, contentLocale);
  const displayedChangedFields = resolveBlogChangedFieldsForLocale(changedFields ?? [], contentLocale);
  const labeledChangedFields = labelBlogChangedFields(
    changedFields ?? [],
    dict.changedFieldsBanner,
  );
  const sourceView = getBlogLocaleView(draft, draft.sourceLocale);
  const mediaMismatch = findMediaMismatch(
    { blocks: draft.translations[draft.sourceLocale]?.media },
    { blocks: draft.translations[contentLocale]?.media },
  );

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
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSavingCopy, setIsSavingCopy] = useState(false);
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
    async (snapshot: BlogEditorDraft) => {
      const task = saveQueueRef.current.then(async () => {
      setSaveStatus("saving");
      try {
        const target = resolveBlogPersistTarget(mode, adminCopyId, draftIdRef.current);
        const result = await persistBlogEditorDraft(snapshot, target);
        if (result.error) {
          toast.error(
            messageForEditorWriteError(result.error, dict.errors) ?? dict.toasts.saveError,
          );
          setSaveStatus("error");
          return false;
        }
        if (result.id) draftIdRef.current = result.id;
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
        return true;
      } catch {
        setSaveStatus("error");
        toast.error(dict.toasts.saveError);
        return false;
      }
      });
      saveQueueRef.current = task.then(() => undefined);
      return task;
    },
    [dict.errors, dict.toasts.saveError, mode, adminCopyId],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (shouldSkipAutosave(mode)) return;
    if (isEditingExisting) return; // editing an existing post — only an explicit "Finish" click persists
    if (!draftIdRef.current && !sourceView.title.trim()) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => persistDraft(draft), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, persistDraft, mode, isEditingExisting, sourceView.title]);

  function scrollToContent() {
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  function canNavigateTo(targetTabId: string): boolean {
    if (mode !== "tripper" || contentLocale !== draft.sourceLocale) return true;
    const targetIndex = tabs.findIndex((t) => t.id === targetTabId);
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (targetIndex <= currentIndex) return true;
    for (let i = 0; i < targetIndex; i++) {
      if (!isBlogTabEligible(tabs[i]!.id, sourceView)) return false;
    }
    return true;
  }

  function handleTabChange(tabId: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    const firstSubstep = tabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "";
    setOpenSectionId(firstSubstep);
    scrollToContent();
  }

  function handleStepClick(tabId: string, substepId?: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
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
    setDraft((prev) => {
      if (contentLocale === prev.sourceLocale) {
        return {
          ...emptyBlogEditorDraft(prev.sourceLocale),
          translations: { ...prev.translations, [contentLocale]: emptyBlogLocaleDraft() },
          coverUrl: prev.coverUrl,
          gallery: prev.gallery,
          travelType: prev.travelType,
          excuseKey: prev.excuseKey,
          level: prev.level,
          label: prev.label,
          tripperNote: prev.tripperNote,
          translationMeta: prev.translationMeta,
          publishedAt: prev.publishedAt,
          isReviewCopy: prev.isReviewCopy,
          status: prev.status,
        };
      }
      const { [contentLocale]: _removed, ...rest } = prev.translations;
      return { ...prev, translations: rest };
    });
  }

  // Editing an already-published RANDOMTRIP post: there is no review step —
  // it's already live — so saving just PATCHes and redirects, mirroring
  // NewExperienceShell's isEditingLiveRandomtrip.
  const isEditingLiveRandomtrip =
    !!isAdminProp && source === "RANDOMTRIP" && draft.status === "published";

  // Submitting for review is the sole finalize action in the wizard, for
  // both a brand-new post and editing an existing DRAFT — mirrors
  // NewExperienceShell's tripper-mode finalize (always available regardless
  // of new/edit), no separate "just save as draft" path. Blocked while
  // read-only (status already PENDING_REVIEW/PENDING_TRIPPER_REVIEW) — the
  // submit route itself is DRAFT-only and would 409 otherwise.
  const canFinalize =
    (mode === "tripper" || mode === "adminCreate") &&
    !isEditingLiveRandomtrip &&
    !isFinishing &&
    !isReadOnly;
  const canSaveChanges = isEditingLiveRandomtrip && !isFinishing && !isReadOnly;

  function handleRequestSubmit() {
    if (!canFinalize && !canSaveChanges) return;
    setSubmitNote(draft.tripperNote ?? "");
    setShowSubmitConfirm(true);
  }

  async function confirmSubmit() {
    setShowSubmitConfirm(false);
    setIsFinishing(true);
    setSubmitError(null);
    setSubmitFailed(false);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    const finalDraft = { ...draft, tripperNote: submitNote } satisfies BlogEditorDraft;
    setDraft(finalDraft);
    try {
      if (!await persistDraft(finalDraft)) throw new Error("Failed to save draft");
      if (!draftIdRef.current) throw new Error("Failed to save draft");

      if (isEditingLiveRandomtrip) {
        router.push(resolveBlogPublishRedirectPath(mode, locale, source));
        return;
      }

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
      router.push(resolveBlogPublishRedirectPath(mode, locale, source));
    } catch (err) {
      console.error(err);
      setSubmitFailed(true);
      setIsFinishing(false);
    }
  }

  function handleChange<K extends keyof BlogFormDraft>(key: K, value: BlogFormDraft[K]) {
    if (contentGeneration !== contentGenerationRef.current) return;
    setDraft((prev) => {
      if (BLOG_LOCALIZED_DRAFT_FIELDS.has(key)) {
        const current = prev.translations[contentLocale] ?? emptyBlogLocaleDraft();
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [contentLocale]: { ...current, [key]: value },
          },
        };
      }
      if (key === "gallery") {
        const gallery = value as string[];
        return {
          ...prev,
          gallery,
          translations: syncGalleryAcrossLocales(prev.translations, gallery),
        };
      }
      return { ...prev, [key]: value };
    });
  }

  function handleContentLocaleChange(language: ContentLocale) {
    if (language === contentLocale) return;
    // Native option menus can blur before change; this handler only serves the selector.
    restoreLanguageFocusRef.current = true;
    contentGenerationRef.current += 1;
    setContentLocale(language);
  }

  function handleApplyTranslatedBlog(update: (current: BlogEditorDraft) => BlogEditorDraft) {
    setDraft((current) => update(current));
  }

  async function handleSaveCopy() {
    if (isReadOnly || isTranslating || isSavingCopy || isFinishing) return;
    setIsSavingCopy(true);
    try {
      await persistDraft(draft);
    } finally {
      setIsSavingCopy(false);
    }
  }

  const imageState = useBlogEditorImages(draft, setDraft, dict.toasts);

  const navTabs = tabs.map((t) => ({ id: t.id, label: t.label }));
  const completedTabIds = useMemo(
    () => tabs.filter((t) => isBlogTabComplete(t.id, sourceView)).map((t) => t.id),
    [tabs, sourceView],
  );

  // Finalize CTA label + confirm-modal copy — falls back to the tripper
  // defaults unless an override (e.g. adminCreate's "Publish") is passed.
  // Editing an already-live RANDOMTRIP post swaps in "Save Changes" copy
  // instead — there is nothing left to "publish".
  const resolvedFinalizeCopy = isEditingLiveRandomtrip
    ? {
        submitLabel: dict.editSubmit,
        confirmTitle: dict.saveChangesConfirmTitle,
        confirmBody: dict.saveChangesConfirmBody,
      }
    : resolveFinalizeCopy(dict, finalizeCopy);
  const effectiveDict = finalizeCopy || isEditingLiveRandomtrip
    ? {
        ...dict,
        actionBar: { ...dict.actionBar, submitForReview: resolvedFinalizeCopy.submitLabel },
      }
    : dict;
  const showTripperNoteField =
    shouldShowTripperNoteField(mode, source) && !isEditingLiveRandomtrip;

  return (
    <div className="bg-gray-50" data-component="NewBlogPostShell">
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
          actionsSlot={reviewActionsSlot}
          changedFields={labeledChangedFields}
          changedFieldsLabel={dict.changedFieldsBanner.prefix}
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
              changedFields={displayedChangedFields}
              contentLanguageSlot={
                <BlogContentLanguage
                  copy={dict.contentLanguage}
                  disabled={isFinishing || isTranslating}
                  inline
                  locale={contentLocale}
                  onChange={handleContentLocaleChange}
                  selectRef={contentLanguageRef}
                />
              }
              contentLocale={contentLocale}
              copy={effectiveDict}
              draft={displayedDraft}
              imageState={imageState}
              isAdmin={isAdminProp ?? (mode !== undefined && mode !== "tripper")}
              isFinishing={isFinishing}
              isSavingCopy={isSavingCopy}
              isTranslating={isTranslating}
              key={contentLocale}
              localeToolsSlot={
                <BlogEditorLocaleTools
                  contentLocale={contentLocale}
                  copy={dict.mediaMismatch}
                  draft={draft}
                  mismatch={mediaMismatch}
                />
              }
              onApplyTranslatedCopy={handleApplyTranslatedBlog}
              onChange={handleChange}
              onClearAll={handleClearAll}
              onContentLocaleChange={handleContentLocaleChange}
              onFinish={handleRequestSubmit}
              onNext={handleNext}
              onPreviousStep={handlePreviousStep}
              onSaveCopy={() => void handleSaveCopy()}
              onSectionChange={handleSectionChange}
              onTranslatingChange={setIsTranslating}
              openSectionId={openSectionId}
              optionalContent={contentLocale !== draft.sourceLocale}
              originalDraft={displayedOriginal}
              readOnly={isReadOnly}
              reviewActionsSlot={
                shouldSwapFooterForReviewActions(mode) ? reviewActionsSlot : undefined
              }
              saveStatus={saveStatus}
              sourceDraft={draft}
              tabs={tabs}
              validationDraft={sourceView}
            />
          </div>
        </div>
      </div>

      <BlogSubmitConfirmModal
        confirm={resolvedFinalizeCopy}
        dict={dict}
        isFinishing={isFinishing}
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={() => void confirmSubmit()}
        onNoteChange={setSubmitNote}
        onOpenChange={setShowSubmitConfirm}
        open={showSubmitConfirm}
        showTripperNoteField={showTripperNoteField}
        submitNote={submitNote}
      />
    </div>
  );
}
