"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Loader2, MessageSquare, X } from "lucide-react";
import { NewExperienceShell } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";
import { Button } from "@/components/ui/Button";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";
import type { ExperienceFormDraft } from "@/types/tripper";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";

function getReviewCopyCopy(locale: string) {
  return locale.startsWith("en")
    ? enCopy.tripperExperienceReviewCopy
    : esCopy.tripperExperienceReviewCopy;
}

interface TripperReviewCopyClientProps {
  dict: TripperExperiencesDict["form"];
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  copyDraft: ExperienceFormDraft;
  originalDraft: ExperienceFormDraft;
  changedFields: string[];
  experienceId: string;
}

export function TripperReviewCopyClient({
  dict,
  locale,
  userBadgeLabels,
  copyDraft,
  originalDraft,
  changedFields,
  experienceId,
}: TripperReviewCopyClientProps) {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) ?? locale;
  const reviewCopyCopy = getReviewCopyCopy(currentLocale);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saving = pendingAction !== null;

  const backPath = `/${locale}/dashboard/tripper/experiences`;

  async function handleApprove() {
    setPendingAction("approve");
    setError(null);
    try {
      const res = await fetch(
        `/api/tripper/experiences/${experienceId}/approve-copy`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      router.push(backPath);
      router.refresh();
    } catch {
      setError(reviewCopyCopy.errorApprove);
      setPendingAction(null);
    }
  }

  async function handleReject() {
    setPendingAction("reject");
    setError(null);
    try {
      const res = await fetch(
        `/api/tripper/experiences/${experienceId}/reject-copy`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      router.push(backPath);
      router.refresh();
    } catch {
      setError(reviewCopyCopy.errorReject);
      setPendingAction(null);
    }
  }

  const reviewActions = (
    <div className="flex flex-col items-end gap-1.5">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void handleReject()}
          disabled={saving}
          className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          {pendingAction === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {reviewCopyCopy.reject}
        </Button>
        <Button
          size="sm"
          onClick={() => void handleApprove()}
          disabled={saving}
          className="gap-2"
        >
          {pendingAction === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {reviewCopyCopy.approve}
        </Button>
      </div>
    </div>
  );

  const reviewLeftSlot = copyDraft.reviewNote ? (
    <div className="flex items-start gap-2 text-sm text-amber-900">
      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="truncate sm:whitespace-normal">
        <span className="font-semibold">{dict.review.approvedNoteTitle}:</span>{" "}
        {copyDraft.reviewNote}
      </p>
    </div>
  ) : undefined;

  return (
    <NewExperienceShell
      dict={dict}
      locale={locale}
      userBadgeLabels={userBadgeLabels}
      initialDraft={copyDraft}
      initialDraftId={experienceId}
      mode="adminReadOnly"
      changedFields={changedFields}
      originalDraft={originalDraft}
      reviewActionsSlot={reviewActions}
      reviewLeftSlot={reviewLeftSlot}
    />
  );
}
