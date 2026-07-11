"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { NewExperienceShell } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";
import type { ExperienceShellMode } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";
import { AdminReviewSlot } from "../../AdminReviewSlot";
import { AdminReviewActionsBar } from "../../AdminReviewActionsBar";
import { getBasePricePerPerson } from "@/lib/data/traveler-types";
import { useDictionary } from "@/hooks/useDictionary";
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
  const router = useRouter();
  const copy = useDictionary((d) => d.adminExperienceReview);
  const [mode, setMode] = useState<ExperienceShellMode>(initialMode);
  const [copyId, setCopyId] = useState<string | null>(initialCopyId);

  const level = initialDraft.level;
  const nonXsedTypes = initialDraft.type.filter((t) => t !== "XSED");

  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      nonXsedTypes.map((t) => {
        const preset = getBasePricePerPerson(t, level);
        return [t, preset > 0 ? String(preset) : ""];
      }),
    ),
  );
  const [reviewNote, setReviewNote] = useState("");
  const [activeSaving, setActiveSaving] = useState<
    "approve" | "reject" | "edit" | "send" | "discard" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const saving = activeSaving !== null;
  const backPath = `/${locale}/dashboard/admin/experiences`;

  const allPricesFilled = nonXsedTypes.every((t) => {
    const v = Number(prices[t]);
    return Number.isFinite(v) && v > 0;
  });

  const lockedByOther = !!reviewLockedBy && reviewLockedBy !== currentAdminId;

  function handleModeChange(newMode: ExperienceShellMode, newCopyId?: string) {
    setMode(newMode);
    if (newCopyId) setCopyId(newCopyId);
    if (newMode === "tripper") setCopyId(null);
  }

  async function handleApprove(note: string) {
    if (!allPricesFilled) return;
    setActiveSaving("approve");
    setError(null);
    try {
      const pricingByType = Object.fromEntries(
        nonXsedTypes.map((t) => [t, Number(prices[t])]),
      );
      const res = await fetch(`/api/admin/experiences/${experienceId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricingByType, reviewNote: note.trim() || null }),
      });
      if (!res.ok) throw new Error();
      router.push(backPath);
      router.refresh();
    } catch {
      setError(copy.errorApprove);
      setActiveSaving(null);
    }
  }

  async function handleReject() {
    if (!reviewNote.trim()) return;
    setActiveSaving("reject");
    setError(null);
    try {
      const res = await fetch(`/api/admin/experiences/${experienceId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: reviewNote.trim() }),
      });
      if (!res.ok) throw new Error();
      router.push(backPath);
      router.refresh();
    } catch {
      setError(copy.errorReject);
      setActiveSaving(null);
    }
  }

  async function handleStartEdit() {
    setActiveSaving("edit");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/experiences/${experienceId}/start-edit`,
        { method: "POST" },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string; lockedBy?: string };
        if (data.error === "locked") {
          setError(copy.errorLocked.replace("{name}", data.lockedBy ?? "unknown"));
        } else {
          throw new Error();
        }
        setActiveSaving(null);
        return;
      }
      const data = (await res.json()) as { copyId: string };
      handleModeChange("adminEdit", data.copyId);
      setActiveSaving(null);
    } catch {
      setError(copy.errorStartEdit);
      setActiveSaving(null);
    }
  }

  async function handleSendToTripper(note: string) {
    setActiveSaving("send");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/experiences/${experienceId}/send-to-tripper`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewNote: note.trim() || null }),
        },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string; message?: string };
        setError(data.message ?? copy.errorSendToTripper);
        setActiveSaving(null);
        return;
      }
      router.push(backPath);
      router.refresh();
    } catch {
      setError(copy.errorSendToTripper);
      setActiveSaving(null);
    }
  }

  async function handleDiscardCopy() {
    setActiveSaving("discard");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/experiences/${experienceId}/discard-copy`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      handleModeChange("tripper");
      router.refresh();
    } catch {
      setError(copy.errorDiscard);
      setActiveSaving(null);
    }
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
      reviewLeftSlot={
        initialDraft.tripperNote ? (
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="truncate sm:whitespace-normal">
              <span className="font-semibold">{copy.tripperNoteLabel}:</span>{" "}
              {initialDraft.tripperNote}
            </p>
          </div>
        ) : undefined
      }
      adminReviewSlot={
        <AdminReviewSlot
          copy={copy}
          lockedByOther={lockedByOther}
          reviewLockedBy={reviewLockedBy}
          reviewLockedByName={reviewLockedByName}
          nonXsedTypes={nonXsedTypes}
          prices={prices}
          onPriceChange={(t, v) => setPrices((prev) => ({ ...prev, [t]: v }))}
          saving={saving}
        />
      }
      reviewActionsSlot={
        <AdminReviewActionsBar
          copy={copy}
          activeSaving={activeSaving}
          allPricesFilled={allPricesFilled}
          adminCopyId={copyId}
          error={error}
          lockedByOther={lockedByOther}
          reviewNote={reviewNote}
          saving={saving}
          onApprove={(note) => void handleApprove(note)}
          onReject={() => void handleReject()}
          onStartEdit={() => void handleStartEdit()}
          onSendToTripper={(note) => void handleSendToTripper(note)}
          onDiscardCopy={() => void handleDiscardCopy()}
          onReviewNoteChange={setReviewNote}
        />
      }
    />
  );
}
