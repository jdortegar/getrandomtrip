"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Accordion } from "@/components/ui/accordion";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import { getBasePricePerPerson } from "@/lib/data/traveler-types";
import { useDictionary } from "@/hooks/useDictionary";
import type { ExperienceShellMode } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";

interface Props {
  experienceId: string;
  types: string[];
  level: string;
  locale: string;
  /** Current admin user id — used to detect soft-lock ownership. */
  currentAdminId?: string;
  /** If set, another admin (or self) holds the edit lock on this experience. */
  reviewLockedBy?: string | null;
  /** Display name of the admin holding the lock (for banner). */
  reviewLockedByName?: string | null;
  /** If set, a review copy exists; id of the copy. */
  adminCopyId?: string | null;
  /** Callback to notify parent when mode changes (e.g. after start-edit). */
  onModeChange?: (mode: ExperienceShellMode, copyId?: string) => void;
}

export function AdminReviewSlot({
  experienceId,
  types,
  level,
  locale,
  currentAdminId,
  reviewLockedBy,
  reviewLockedByName,
  adminCopyId,
  onModeChange,
}: Props) {
  const router = useRouter();
  const copy = useDictionary((d) => d.adminExperienceReview);
  const nonXsedTypes = types.filter((t) => t !== "XSED");

  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      nonXsedTypes.map((t) => {
        const preset = getBasePricePerPerson(t, level);
        return [t, preset > 0 ? String(preset) : ""];
      }),
    ),
  );
  const [rejecting, setRejecting] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [activeSaving, setActiveSaving] = useState<"approve" | "reject" | "edit" | "send" | "discard" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saving = activeSaving !== null;

  const backPath = `/${locale}/dashboard/admin/experiences`;

  const allPricesFilled = nonXsedTypes.every((t) => {
    const v = Number(prices[t]);
    return Number.isFinite(v) && v > 0;
  });

  // Soft-lock: locked by a DIFFERENT admin
  const lockedByOther =
    reviewLockedBy && reviewLockedBy !== currentAdminId;

  async function handleApprove() {
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
        body: JSON.stringify({ pricingByType }),
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
      const res = await fetch(`/api/admin/experiences/${experienceId}/start-edit`, {
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
      onModeChange?.("adminEdit", data.copyId);
      setActiveSaving(null);
    } catch {
      setError(copy.errorStartEdit);
      setActiveSaving(null);
    }
  }

  async function handleSendToTripper() {
    setActiveSaving("send");
    setError(null);
    try {
      const res = await fetch(`/api/admin/experiences/${experienceId}/send-to-tripper`, {
        method: "POST",
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
      const res = await fetch(`/api/admin/experiences/${experienceId}/discard-copy`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      onModeChange?.("tripper");
      router.refresh();
    } catch {
      setError(copy.errorDiscard);
      setActiveSaving(null);
    }
  }

  const btnNeutral = "text-sm font-medium text-gray-700 underline hover:no-underline disabled:opacity-50";

  return (
    <div className="flex flex-col gap-4">
      {/* Soft-lock warning banner */}
      {lockedByOther && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{copy.lockedBannerTitle}</strong>{" "}
            {reviewLockedByName ?? reviewLockedBy}. {copy.lockedBannerBody}
          </span>
        </div>
      )}

      {nonXsedTypes.length > 0 && (
        <Accordion type="single" collapsible defaultValue="admin-pricing">
          <JourneyDropdown
            value="admin-pricing"
            label={copy.priceSection}
            content=""
          >
            <div className="space-y-5">
              {nonXsedTypes.map((t) => (
                <FormField
                  key={t}
                  id={`admin-price-${t}`}
                  label={<span className="capitalize">{t}</span>}
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0"
                  value={prices[t] ?? ""}
                  onChange={(e) =>
                    setPrices((prev) => ({ ...prev, [t]: e.target.value }))
                  }
                  disabled={saving}
                />
              ))}
            </div>
          </JourneyDropdown>
        </Accordion>
      )}

      {rejecting && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-500">{copy.noteLabel}</p>
          <textarea
            rows={3}
            placeholder={copy.notePlaceholder}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            disabled={saving}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:opacity-50"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Primary actions — approve/reject when reviewing, send/discard when editing */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-6 border-t border-gray-200">
        {adminCopyId ? (
          // Edit mode: discard (secondary text) + send to tripper (primary button)
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleDiscardCopy()}
              disabled={saving}
              className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              {activeSaving === "discard" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              {copy.discardChanges}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSendToTripper()}
              disabled={saving}
            >
              {activeSaving === "send" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Send className="h-4 w-4 mr-1.5" />{copy.sendToTripper}</>
              )}
            </Button>
          </>
        ) : !rejecting ? (
          // Review mode: reject (text) + edit (secondary) + approve (primary)
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejecting(true)}
              disabled={saving}
              className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <X className="h-4 w-4" />
              {copy.reject}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void handleStartEdit()}
              disabled={saving || !!lockedByOther}
              className="gap-2"
            >
              {activeSaving === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              {copy.editExperience}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleApprove()}
              disabled={!allPricesFilled || saving || !!lockedByOther}
            >
              {activeSaving === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                copy.approve
              )}
            </Button>
          </>
        ) : (
          // Rejection confirm: cancel + confirm
          <>
            <button type="button" onClick={() => { setRejecting(false); setReviewNote(""); }} disabled={saving} className={btnNeutral}>
              {copy.cancel}
            </button>
            <Button
              size="sm"
              onClick={() => void handleReject()}
              disabled={!reviewNote.trim() || saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {activeSaving === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                copy.confirmReject
              )}
            </Button>
          </>
        )}
      </div>

    </div>
  );
}
