"use client";

import { PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  BLOG_EXCUSE_OPTIONS,
  BLOG_TRAVEL_TYPE_OPTIONS,
} from "@/lib/constants/blog-filters";
import type { TripperBlogComposerDict } from "@/lib/types/dictionary";
import type { BlogPost } from "@/types/blog";

export type BlogComposerSidebarCopy = Pick<
  TripperBlogComposerDict,
  | "addTagAria"
  | "audienceUnsetLabel"
  | "excuseKeyLabel"
  | "formatArticle"
  | "formatLabel"
  | "formatMixed"
  | "formatPhoto"
  | "formatVideo"
  | "preview"
  | "publish"
  | "publishing"
  | "settingsTitle"
  | "statusDraft"
  | "statusLabel"
  | "statusPublished"
  | "tagPlaceholder"
  | "tagsLabel"
  | "travelTypeLabel"
>;

interface BlogComposerSidebarProps {
  copy: BlogComposerSidebarCopy;
  excuseKey: string;
  format: BlogPost["format"];
  onAddTag: () => void;
  onExcuseKeyChange: (value: string) => void;
  onFormatChange: (format: BlogPost["format"]) => void;
  onPreview: () => void;
  onPublish: () => void;
  onRemoveTag: (tag: string) => void;
  onTagInputChange: (value: string) => void;
  onTravelTypeChange: (value: string) => void;
  postId: string | undefined;
  postStatus: BlogPost["status"] | undefined;
  publishing: boolean;
  saving: boolean;
  tagInput: string;
  tags: string[];
  travelType: string;
}

export function BlogComposerSidebar({
  copy,
  excuseKey,
  format,
  onAddTag,
  onExcuseKeyChange,
  onFormatChange,
  onPreview,
  onPublish,
  onRemoveTag,
  onTagInputChange,
  onTravelTypeChange,
  postId,
  postStatus,
  publishing,
  saving,
  tagInput,
  tags,
  travelType,
}: BlogComposerSidebarProps) {
  function handleTagInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      onAddTag();
    }
  }

  const selectClassName =
    "mb-4 w-full rounded-lg border border-neutral-300 p-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  const showPreview = Boolean(postId && postId !== "new");

  return (
    <aside className="w-full shrink-0 space-y-6 text-left lg:w-96">
      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm text-left">
        <h3 className="font-semibold mb-4 text-left text-lg text-neutral-900">
          {copy.settingsTitle}
        </h3>
        <label
          className="mb-1 block font-medium text-left text-sm text-neutral-500"
          htmlFor="blog-format"
        >
          {copy.formatLabel}
        </label>
        <select
          className={selectClassName}
          id="blog-format"
          onChange={(e) => onFormatChange(e.target.value as BlogPost["format"])}
          value={format}
        >
          <option value="article">{copy.formatArticle}</option>
          <option value="photo">{copy.formatPhoto}</option>
          <option value="video">{copy.formatVideo}</option>
          <option value="mixed">{copy.formatMixed}</option>
        </select>

        <label
          className="mb-1 block font-medium text-left text-sm text-neutral-500"
          htmlFor="blog-composer-travel-type"
        >
          {copy.travelTypeLabel}
        </label>
        <select
          className={selectClassName}
          id="blog-composer-travel-type"
          onChange={(e) => onTravelTypeChange(e.target.value)}
          value={travelType}
        >
          <option value="">{copy.audienceUnsetLabel}</option>
          {BLOG_TRAVEL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>

        <label
          className="mb-1 block font-medium text-left text-sm text-neutral-500"
          htmlFor="blog-composer-excuse-key"
        >
          {copy.excuseKeyLabel}
        </label>
        <select
          className={selectClassName}
          id="blog-composer-excuse-key"
          onChange={(e) => onExcuseKeyChange(e.target.value)}
          value={excuseKey}
        >
          <option value="">{copy.audienceUnsetLabel}</option>
          {BLOG_EXCUSE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>

        <label
          className="mb-1 block font-medium text-left text-sm text-neutral-500"
          htmlFor="blog-status-display"
        >
          {copy.statusLabel}
        </label>
        <p
          className="mb-4 text-left text-sm text-neutral-800"
          id="blog-status-display"
        >
          {postStatus === "published" ? copy.statusPublished : copy.statusDraft}
        </p>

        <label
          className="mb-2 block font-medium text-left text-sm text-neutral-500"
          htmlFor="blog-tag-input"
        >
          {copy.tagsLabel}
        </label>
        <div className="mb-2 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            id="blog-tag-input"
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder={copy.tagPlaceholder}
            type="text"
            value={tagInput}
          />
          <Button
            aria-label={copy.addTagAria}
            onClick={onAddTag}
            size="sm"
            type="button"
            variant="secondary"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
              key={tag}
            >
              {tag}
              <button
                className="text-neutral-500 hover:text-neutral-800"
                onClick={() => onRemoveTag(tag)}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4 text-left">
        <Button
          disabled={publishing || saving}
          onClick={onPublish}
          type="button"
        >
          {publishing ? copy.publishing : copy.publish}
        </Button>
        {showPreview ? (
          <Button onClick={onPreview} type="button" variant="secondary">
            {copy.preview}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
