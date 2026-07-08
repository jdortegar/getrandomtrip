"use client";

import { useState } from "react";
import { NewExperienceShell } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";
import type { ExperienceShellMode } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";
import { AdminReviewSlot } from "../../AdminReviewSlot";
import type { ExperienceFormDraft } from "@/types/tripper";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";

interface AdminExperienceReviewClientProps {
  dict: TripperExperiencesDict["form"];
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  initialDraft: ExperienceFormDraft;
  experienceId: string;
  currentAdminId: string;
  initialMode?: ExperienceShellMode;
  reviewLockedBy: string | null;
  reviewLockedByName: string | null;
  adminCopyId: string | null;
}

export function AdminExperienceReviewClient({
  dict,
  locale,
  userBadgeLabels,
  initialDraft,
  experienceId,
  currentAdminId,
  initialMode = "adminReadOnly",
  reviewLockedBy,
  reviewLockedByName,
  adminCopyId: initialCopyId,
}: AdminExperienceReviewClientProps) {
  const [mode, setMode] = useState<ExperienceShellMode>(initialMode);
  const [copyId, setCopyId] = useState<string | null>(initialCopyId);

  function handleModeChange(newMode: ExperienceShellMode, newCopyId?: string) {
    setMode(newMode);
    if (newCopyId) setCopyId(newCopyId);
    if (newMode === "tripper") setCopyId(null);
  }

  return (
    <NewExperienceShell
      dict={dict}
      locale={locale}
      userBadgeLabels={userBadgeLabels}
      initialDraft={initialDraft}
      initialDraftId={experienceId}
      mode={mode}
      adminCopyId={copyId ?? undefined}
      adminReviewSlot={
        <AdminReviewSlot
          experienceId={experienceId}
          types={initialDraft.type}
          level={initialDraft.level}
          locale={locale}
          currentAdminId={currentAdminId}
          reviewLockedBy={reviewLockedBy}
          reviewLockedByName={reviewLockedByName}
          adminCopyId={copyId}
          onModeChange={handleModeChange}
        />
      }
    />
  );
}
