"use client";

import { Button } from "@/components/ui/Button";
import {
  BLOG_TRAVEL_TYPE_OPTIONS,
} from "@/lib/constants/blog-filters";
import { getExcusesByTravelerType } from "@/lib/data/shared/excuses";
import type { TripperBlogComposerDict } from "@/lib/types/dictionary";
import type { BlogPost } from "@/types/blog";

export type BlogComposerSidebarCopy = Pick<
  TripperBlogComposerDict,
  | "audienceUnsetLabel"
  | "excuseKeyLabel"
  | "preview"
  | "publish"
  | "publishing"
  | "settingsTitle"
  | "statusDraft"
  | "statusLabel"
  | "statusPublished"
  | "travelTypeLabel"
>;

interface BlogComposerSidebarProps {
  copy: BlogComposerSidebarCopy;
  excuseKey: string;
  onExcuseKeyChange: (value: string) => void;
  onPreview: () => void;
  onPublish: () => void;
  onTravelTypeChange: (value: string) => void;
  postId: string | undefined;
  postStatus: BlogPost["status"] | undefined;
  publishing: boolean;
  saving: boolean;
  travelType: string;
}

export function BlogComposerSidebar({
  copy,
  excuseKey,
  onExcuseKeyChange,
  onPreview,
  onPublish,
  onTravelTypeChange,
  postId,
  postStatus,
  publishing,
  saving,
  travelType,
}: BlogComposerSidebarProps) {
  const selectClassName =
    "mb-4 w-full rounded-lg border border-neutral-300 p-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  const excuseOptions = getExcusesByTravelerType(travelType).map((excuse) => ({
    key: excuse.key,
    label: excuse.title,
  }));

  const showPreview = Boolean(postId && postId !== "new");

  return (
    <aside className="w-full shrink-0 space-y-6 text-left lg:w-96">
      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm text-left">
        <h3 className="font-semibold mb-4 text-left text-lg text-neutral-900">
          {copy.settingsTitle}
        </h3>

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
          {excuseOptions.map((opt) => (
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
