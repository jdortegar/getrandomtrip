"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
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
  changedFields: string[];
  experienceId: string;
}

export function TripperReviewCopyClient({
  dict,
  locale,
  userBadgeLabels,
  copyDraft,
  changedFields,
  experienceId,
}: TripperReviewCopyClientProps) {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) ?? locale;
  const reviewCopyCopy = getReviewCopyCopy(currentLocale);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backPath = `/${locale}/dashboard/tripper/experiences`;

  async function handleApprove() {
    setSaving(true);
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
      setSaving(false);
    }
  }

  async function handleReject() {
    setSaving(true);
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
      setSaving(false);
    }
  }

  const reviewActions = (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-center text-red-600">{error}</p>}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleReject()}
          disabled={saving}
          className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          {saving ? (
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
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {reviewCopyCopy.approve}
        </Button>
      </div>
    </div>
  );

  return (
    <NewExperienceShell
      dict={dict}
      locale={locale}
      userBadgeLabels={userBadgeLabels}
      initialDraft={copyDraft}
      initialDraftId={experienceId}
      mode="adminReadOnly"
      changedFields={changedFields}
      reviewActionsSlot={reviewActions}
    />
  );
}
