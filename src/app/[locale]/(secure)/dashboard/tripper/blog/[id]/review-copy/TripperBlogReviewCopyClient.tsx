"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Loader2, MessageSquare, X } from "lucide-react";
import { NewBlogPostShell } from "@/components/app/dashboard/tripper/blog/NewBlogPostShell";
import { Button } from "@/components/ui/Button";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";
import type { BlogFormDraft } from "@/types/blog";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";

function getReviewCopyCopy(locale: string) {
  return locale.startsWith("en") ? enCopy.tripperBlogReviewCopy : esCopy.tripperBlogReviewCopy;
}

interface TripperBlogReviewCopyClientProps {
  dict: TripperBlogFormDict;
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  copyDraft: BlogFormDraft;
  originalDraft: BlogFormDraft;
  changedFields: string[];
  reviewNote: string | null;
  blogId: string;
}

export function TripperBlogReviewCopyClient({
  dict,
  locale,
  userBadgeLabels,
  copyDraft,
  originalDraft,
  changedFields,
  reviewNote,
  blogId,
}: TripperBlogReviewCopyClientProps) {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) ?? locale;
  const reviewCopyCopy = getReviewCopyCopy(currentLocale);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saving = pendingAction !== null;

  const backPath = `/${locale}/dashboard/tripper/blog`;

  async function handleApprove() {
    setPendingAction("approve");
    setError(null);
    try {
      const res = await fetch(`/api/tripper/blogs/${blogId}/approve-copy`, {
        method: "POST",
      });
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
      const res = await fetch(`/api/tripper/blogs/${blogId}/reject-copy`, {
        method: "POST",
      });
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

  const reviewLeftSlot = reviewNote ? (
    <div className="flex items-start gap-2 text-sm text-amber-900">
      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="truncate sm:whitespace-normal">
        <span className="font-semibold">{reviewCopyCopy.noteLabel}:</span> {reviewNote}
      </p>
    </div>
  ) : undefined;

  return (
    <NewBlogPostShell
      dict={dict}
      locale={locale}
      userBadgeLabels={userBadgeLabels}
      initialDraft={copyDraft}
      initialDraftId={blogId}
      mode="adminReadOnly"
      reviewActionsSlot={reviewActions}
      reviewLeftSlot={reviewLeftSlot}
      changedFields={changedFields}
      originalDraft={originalDraft}
    />
  );
}
