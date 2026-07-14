"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { BlogFormContent } from "./BlogFormContent";
import type { BlogFormDraft } from "@/types/blog";
import { buildBlogSubmitPayload, isBlogTabComplete } from "@/lib/helpers/blog-form";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isFinishing, setIsFinishing] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const draftIdRef = useRef<string | null>(initialDraftId ?? null);
  const isFirstRender = useRef(true);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const persistDraft = useCallback(
    async (snapshot: BlogFormDraft) => {
      setSaveStatus("saving");
      try {
        const payload = buildBlogSubmitPayload(snapshot);
        if (!draftIdRef.current) {
          const res = await fetch("/api/tripper/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { blog: { id: string } };
          draftIdRef.current = data.blog.id;
        } else {
          const res = await fetch(`/api/tripper/blogs/${draftIdRef.current}`, {
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
    [dict.toasts.saveError],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!draftIdRef.current && !draft.title.trim()) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => persistDraft(draft), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, persistDraft]);

  function scrollToContent() {
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  function canNavigateTo(targetTabId: string): boolean {
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

  async function handleFinish() {
    if (!isBlogTabComplete("general", draft) || isFinishing) return;
    setIsFinishing(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    await persistDraft(draft);
    router.push(pathForLocale(locale as Locale, "/dashboard/tripper/blog"));
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

      <div className="rt-container py-4 sm:py-8 scroll-mt-20" ref={contentRef}>
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
              onFinish={() => void handleFinish()}
              openSectionId={openSectionId}
              onSectionChange={handleSectionChange}
              tabs={tabs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
