"use client";

import { Loader2 } from "lucide-react";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";
import type { TripperProfileStatus } from "@/types/tripper";

export type ProfileSaveState = "clean" | "dirty" | "saving" | "saved";

interface ProfileEditorStatusBarProps {
  copy: TripperProfileEditorDict["status"];
  locale: string;
  onSave: () => void;
  saveState: ProfileSaveState;
  savedAt: Date | null;
  status: TripperProfileStatus;
}

/** Review status (draft / in review / changes requested / published) plus the save-draft action. */
export function ProfileEditorStatusBar({
  copy,
  locale,
  onSave,
  saveState,
  savedAt,
  status,
}: ProfileEditorStatusBarProps) {
  const isSaving = saveState === "saving";
  const saveLabel =
    saveState === "dirty"
      ? copy.unsaved
      : saveState === "saved" && savedAt
        ? interpolateTemplate(copy.saved, {
            time: savedAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
          })
        : saveState === "saving"
          ? copy.saving
          : copy.notSavedYet;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-y border-gray-200 py-4",
        "sm:flex-row sm:items-center sm:justify-between",
      )}
      data-component="ProfileEditorStatusBar"
    >
      <div className="flex flex-wrap items-center gap-3">
        <StatusIndicatorBadge family="tripper-profile" label={copy.labels[status]} status={status} />
        <p className="text-sm text-neutral-600">{copy.descriptions[status]}</p>
      </div>
      <div className="flex items-center gap-4">
        <p aria-live="polite" className="text-xs text-neutral-500">
          {saveLabel}
        </p>
        <button
          aria-busy={isSaving || undefined}
          className={cn(
            "flex min-h-11 items-center gap-2 border-b border-primary text-sm text-primary transition-colors",
            "hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          disabled={isSaving || saveState === "saved" || saveState === "clean"}
          onClick={onSave}
          type="button"
        >
          {isSaving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
          {isSaving ? copy.saving : copy.saveDraft}
        </button>
      </div>
    </div>
  );
}
