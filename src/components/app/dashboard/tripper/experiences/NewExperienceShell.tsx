"use client";

import { useRef, useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, X } from "lucide-react";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { ExperienceFormContent } from "./ExperienceFormContent";
import type { ExperienceFormDraft } from "@/types/tripper";
import { isExperienceTabComplete } from "@/lib/helpers/experience-form";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface ExperienceImageState {
  onHeroSelect: (file: File) => void;
  onGalleryFilesSelect: (files: File[]) => void;
  onHeroRemove: () => void;
  onGalleryRemove: (index: number) => void;
}

interface NewExperienceShellProps {
  adminReviewSlot?: ReactNode;
  dict: TripperExperiencesDict["form"];
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  initialDraft?: ExperienceFormDraft;
  initialDraftId?: string;
}

const EMPTY_DRAFT: ExperienceFormDraft = {
  status: "DRAFT",
  title: "",
  type: ["couple"],
  level: "essenza",
  teaser: "",
  description: "",
  heroImage: "",
  galleryImages: [],
  tags: [],
  highlights: [],
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
  activities: [{ name: "", durationRhythm: null, description: "", risks: "" }],
  itinerary: [{ title: "", description: "" }],
  inclusions: [],
  exclusions: [],
  createBlogPost: false,
};

const AUTOSAVE_DELAY_MS = 2000;
const MAX_GALLERY = 3;

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

const ADMIN_TAB: { id: string; label: string; substeps: { description: string; id: string; title: string }[] } = {
  id: "admin-review",
  label: "Admin",
  substeps: [
    { id: "admin-pricing", title: "Pricing & approval", description: "" },
  ],
};

export function NewExperienceShell({
  adminReviewSlot,
  dict,
  locale,
  userBadgeLabels,
  initialDraft,
  initialDraftId,
}: NewExperienceShellProps) {
  const router = useRouter();
  const tabs = dict.contentTabs;
  const effectiveTabs = adminReviewSlot ? [...tabs, ADMIN_TAB] : tabs;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "about");
  const [openSectionId, setOpenSectionId] = useState(
    tabs[0]?.substeps[0]?.id ?? "",
  );
  const [form, setForm] = useState<ExperienceFormDraft>(
    initialDraft ?? EMPTY_DRAFT,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [submitError, setSubmitError] = useState<string[] | null>(null);

  // Derived read-only flag — all edits blocked while in PENDING_REVIEW
  const isReadOnly = form.status === "PENDING_REVIEW";

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

      // Gallery
      const apiGallery = [...result.galleryImages];
      for (let i = 0; i < apiGallery.length; i++) {
        const blobUrl = apiGallery[i];
        if (!blobUrl?.startsWith("blob:")) continue;
        const file = pendingFilesRef.current.get(blobUrl);
        if (file) {
          try {
            const url = await uploadImageFile(file);
            pendingFilesRef.current.delete(blobUrl);
            URL.revokeObjectURL(blobUrl);
            apiGallery[i] = url;
            setForm((prev) => {
              const gallery = [...prev.galleryImages];
              const idx = gallery.indexOf(blobUrl);
              if (idx !== -1) gallery[idx] = url;
              return { ...prev, galleryImages: gallery };
            });
          } catch {
            apiGallery[i] = ""; // strip from API only
          }
        } else {
          apiGallery[i] = "";
        }
      }
      result = { ...result, galleryImages: apiGallery.filter(Boolean) };

      return result;
    },
    [],
  );

  const persistDraft = useCallback(
    async (snapshot: ExperienceFormDraft) => {
      if (isReadOnly) return; // no autosave while pending review
      setSaveStatus("saving");
      try {
        const finalSnapshot = await flushPendingBlobs(snapshot);
        if (!draftIdRef.current) {
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
    [flushPendingBlobs],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isReadOnly) return; // no autosave while pending review
    if (!draftIdRef.current && !form.title.trim()) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => persistDraft(form), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [form, persistDraft, isReadOnly]);

  function canNavigateTo(targetTabId: string): boolean {
    if (adminReviewSlot) return true;
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
    const firstSubstep =
      effectiveTabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "";
    setOpenSectionId(firstSubstep);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleStepClick(tabId: string, substepId?: string) {
    if (!canNavigateTo(tabId)) return;
    setActiveTab(tabId);
    setOpenSectionId(
      substepId ?? effectiveTabs.find((t) => t.id === tabId)?.substeps[0]?.id ?? "",
    );
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  function handleClearAll() {
    setForm(EMPTY_DRAFT);
  }

  async function handleSubmit() {
    if (isSubmitting || isReadOnly) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const finalForm = await flushPendingBlobs(form);

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

      // Submit for review
      const submitRes = await fetch(
        `/api/tripper/experiences/${draftIdRef.current}/submit`,
        { method: "POST" },
      );

      if (!submitRes.ok) {
        const body = (await submitRes.json()) as { error?: string; missing?: string[] };
        if (submitRes.status === 422 && body.missing) {
          setSubmitError(body.missing);
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

  function handleGalleryFilesSelect(files: File[]) {
    const slotsLeft = MAX_GALLERY - form.galleryImages.length;
    const toAdd = files.slice(0, slotsLeft);
    if (toAdd.length === 0) return;
    const blobUrls = toAdd.map((file) => {
      const blobUrl = URL.createObjectURL(file);
      pendingFilesRef.current.set(blobUrl, file);
      return blobUrl;
    });
    setForm((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, ...blobUrls],
    }));
  }

  function handleGalleryRemove(index: number) {
    const url = form.galleryImages[index];
    if (url?.startsWith("blob:")) {
      pendingFilesRef.current.delete(url);
      URL.revokeObjectURL(url);
    }
    setForm((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  }

  const imageState: ExperienceImageState = {
    onHeroSelect: handleHeroSelect,
    onGalleryFilesSelect: handleGalleryFilesSelect,
    onHeroRemove: handleHeroRemove,
    onGalleryRemove: handleGalleryRemove,
  };

  const navTabs = effectiveTabs.map((t) => ({ id: t.id, label: t.label }));
  const completedTabIds = useMemo(
    () =>
      effectiveTabs
        .filter((t) => t.id !== "admin-review" && isExperienceTabComplete(t.id, form))
        .map((t) => t.id),
    [effectiveTabs, form],
  );

  // Rejection banner: shown when DRAFT + reviewNote exists + not dismissed
  const showRejectionBanner =
    form.status === "DRAFT" && !!form.reviewNote && !bannerDismissed;

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

      <div className="rt-container py-4 sm:py-8 scroll-mt-20" ref={contentRef}>
        {/* Rejection feedback banner */}
        {showRejectionBanner && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            <div className="flex-1 text-sm text-amber-800">
              <p className="font-medium mb-1">Changes requested</p>
              <p>{form.reviewNote}</p>
            </div>
            <button
              type="button"
              className="ml-auto shrink-0 text-amber-500 hover:text-amber-700"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Submit error banner */}
        {submitError && submitError.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
            <div className="text-sm text-red-800">
              <span className="font-medium">Required fields missing: </span>
              {submitError.join(", ")}
            </div>
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
              copy={dict}
              form={form}
              imageState={imageState}
              isReadOnly={isReadOnly}
              isSubmitting={isSubmitting}
              saveStatus={saveStatus}
              onChange={handleChange}
              onClearAll={handleClearAll}
              onNext={handleNext}
              onSubmit={handleSubmit}
              openSectionId={openSectionId}
              onSectionChange={handleSectionChange}
              tabs={effectiveTabs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
