"use client";

import type { BlogEditorDraft, BlogMediaMismatch, ContentLocale } from "@/types/blog";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import { BlogMediaMismatchWarning } from "./BlogMediaMismatchWarning";

interface BlogEditorLocaleToolsProps {
  contentLocale: ContentLocale;
  copy: TripperBlogFormDict["mediaMismatch"];
  draft: BlogEditorDraft;
  mismatch: BlogMediaMismatch;
}

export function BlogEditorLocaleTools({
  contentLocale,
  copy,
  draft,
  mismatch,
}: BlogEditorLocaleToolsProps) {
  if (contentLocale === draft.sourceLocale) return null;

  return (
    <div className="flex flex-col gap-3" data-component="BlogEditorLocaleTools">
      <BlogMediaMismatchWarning copy={copy} mismatch={mismatch} />
    </div>
  );
}
