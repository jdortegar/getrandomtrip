"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { NewBlogPostShell } from "@/components/app/dashboard/tripper/blog/NewBlogPostShell";
import type { BlogShellMode } from "@/components/app/dashboard/tripper/blog/NewBlogPostShell";
import { AdminBlogReviewActionsBar } from "../../AdminBlogReviewActionsBar";
import { useDictionary } from "@/hooks/useDictionary";
import type { BlogFormDraft } from "@/types/blog";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";

interface AdminBlogReviewClientProps {
  dict: TripperBlogFormDict;
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
  initialDraft: BlogFormDraft;
  blogId: string;
  currentAdminId: string;
  initialMode?: BlogShellMode;
  reviewLockedBy: string | null;
  reviewLockedByName: string | null;
  adminCopyId: string | null;
  tripperNote: string | null;
}

export function AdminBlogReviewClient({
  dict,
  locale,
  userBadgeLabels,
  initialDraft,
  blogId,
  currentAdminId,
  initialMode = "adminReadOnly",
  reviewLockedBy,
  reviewLockedByName,
  adminCopyId: initialCopyId,
  tripperNote,
}: AdminBlogReviewClientProps) {
  const router = useRouter();
  const copy = useDictionary((d) => d.adminBlogReview);
  const [mode, setMode] = useState<BlogShellMode>(initialMode);
  const [copyId, setCopyId] = useState<string | null>(initialCopyId);
  const [reviewNote, setReviewNote] = useState("");
  const [activeSaving, setActiveSaving] = useState<
    "approve" | "reject" | "edit" | "send" | "discard" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const saving = activeSaving !== null;
  const backPath = `/${locale}/dashboard/admin/blog`;
  const lockedByOther = !!reviewLockedBy && reviewLockedBy !== currentAdminId;

  function handleModeChange(newMode: BlogShellMode, newCopyId?: string) {
    setMode(newMode);
    if (newCopyId) setCopyId(newCopyId);
    if (newMode === "tripper") setCopyId(null);
  }

  async function handleApprove(note: string) {
    setActiveSaving("approve");
    setError(null);
    try {
      const res = await fetch(`/api/admin/blogs/${blogId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: note.trim() || null }),
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
      const res = await fetch(`/api/admin/blogs/${blogId}/reject`, {
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
      const res = await fetch(`/api/admin/blogs/${blogId}/start-edit`, {
        method: "POST",
      });
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
      const res = await fetch(`/api/admin/blogs/${blogId}/send-to-tripper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: note.trim() || null }),
      });
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
      const res = await fetch(`/api/admin/blogs/${blogId}/discard-copy`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      handleModeChange("adminReadOnly");
      setActiveSaving(null);
      router.refresh();
    } catch {
      setError(copy.errorDiscard);
      setActiveSaving(null);
    }
  }

  return (
    <NewBlogPostShell
      dict={dict}
      locale={locale}
      userBadgeLabels={userBadgeLabels}
      initialDraft={initialDraft}
      initialDraftId={blogId}
      mode={mode}
      adminCopyId={copyId ?? undefined}
      reviewLeftSlot={
        tripperNote ? (
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="truncate sm:whitespace-normal">
              <span className="font-semibold">{copy.tripperNoteLabel}:</span> {tripperNote}
            </p>
          </div>
        ) : undefined
      }
      reviewActionsSlot={
        <AdminBlogReviewActionsBar
          copy={copy}
          activeSaving={activeSaving}
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
