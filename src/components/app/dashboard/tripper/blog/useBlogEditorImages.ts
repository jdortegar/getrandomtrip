"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { BlogEditorDraft } from "@/types/blog";
import { syncGalleryAcrossLocales } from "@/lib/helpers/blog-form";
import {
  deleteBlogImageFile,
  uploadBlogImageFile,
  validateBlogImageSize,
} from "./blogEditorImages";

export interface BlogImageState {
  coverUploading: boolean;
  onCoverSelect: (file: File) => void;
  onCoverRemove: () => void;
  galleryUploading: boolean;
  onGalleryFilesSelect: (files: File[]) => void;
  onGalleryImageRemove: (index: number) => void;
}

interface BlogImageToasts {
  fileTooLarge: string;
  uploadError: string;
}

export function useBlogEditorImages(
  draft: BlogEditorDraft,
  setDraft: Dispatch<SetStateAction<BlogEditorDraft>>,
  toasts: BlogImageToasts,
): BlogImageState {
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  async function handleCoverSelect(file: File) {
    if (!validateBlogImageSize(file)) {
      toast.error(toasts.fileTooLarge);
      return;
    }
    setCoverUploading(true);
    try {
      const oldCover = draft.coverUrl;
      const url = await uploadBlogImageFile(file, "blog-cover");
      setDraft((prev) => ({ ...prev, coverUrl: url }));
      if (oldCover) await deleteBlogImageFile(oldCover).catch(() => null);
    } catch {
      toast.error(toasts.uploadError);
    } finally {
      setCoverUploading(false);
    }
  }

  function handleCoverRemove() {
    const old = draft.coverUrl;
    setDraft((prev) => ({ ...prev, coverUrl: "" }));
    if (old) void deleteBlogImageFile(old).catch(() => null);
  }

  async function handleGalleryFilesSelect(files: File[]) {
    const oversized = files.filter((f) => !validateBlogImageSize(f));
    if (oversized.length > 0) {
      toast.error(toasts.fileTooLarge);
      return;
    }
    setGalleryUploading(true);
    try {
      const results = await Promise.allSettled(
        files.map((f) => uploadBlogImageFile(f, "blog-gallery")),
      );
      const urls: string[] = [];
      let failCount = 0;
      for (const result of results) {
        if (result.status === "fulfilled") urls.push(result.value);
        else failCount++;
      }
      if (failCount > 0) toast.error(toasts.uploadError);
      if (urls.length > 0) {
        setDraft((prev) => {
          const gallery = [...prev.gallery, ...urls];
          return {
            ...prev,
            gallery,
            translations: syncGalleryAcrossLocales(prev.translations, gallery),
          };
        });
      }
    } finally {
      setGalleryUploading(false);
    }
  }

  function handleGalleryImageRemove(index: number) {
    const url = draft.gallery[index];
    setDraft((prev) => {
      const gallery = prev.gallery.filter((_, i) => i !== index);
      return {
        ...prev,
        gallery,
        translations: syncGalleryAcrossLocales(prev.translations, gallery),
      };
    });
    if (url) void deleteBlogImageFile(url).catch(() => null);
  }

  return {
    coverUploading,
    onCoverSelect: handleCoverSelect,
    onCoverRemove: handleCoverRemove,
    galleryUploading,
    onGalleryFilesSelect: handleGalleryFilesSelect,
    onGalleryImageRemove: handleGalleryImageRemove,
  };
}
