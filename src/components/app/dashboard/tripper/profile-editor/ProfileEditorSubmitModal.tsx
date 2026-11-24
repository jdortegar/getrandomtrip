"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { TripperProfileEditorDict } from "@/lib/types/dictionary";

interface ProfileEditorSubmitModalProps {
  copy: TripperProfileEditorDict["submitModal"];
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

/** Confirms the rights declaration and submits an immutable copy of the draft for review. */
export function ProfileEditorSubmitModal({ copy, onConfirm, onOpenChange, open }: ProfileEditorSubmitModalProps) {
  const [hasConfirmedRights, setHasConfirmedRights] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return;
    if (!next) setHasConfirmedRights(false);
    onOpenChange(next);
  }

  async function handleSubmit() {
    if (isSubmitting || !hasConfirmedRights) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
      setHasConfirmedRights(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal className="max-w-lg p-6 sm:p-8" onOpenChange={handleOpenChange} open={open}>
      <DialogHeader className="gap-3 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{copy.eyebrow}</p>
        <DialogTitle className="font-barlow-condensed text-3xl font-bold leading-none text-ink">
          {copy.title}
        </DialogTitle>
        <DialogDescription className="text-sm text-neutral-600">{copy.body}</DialogDescription>
      </DialogHeader>
      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-ink" htmlFor="profile-submit-rights">
        <input
          checked={hasConfirmedRights}
          className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
          id="profile-submit-rights"
          onChange={(e) => setHasConfirmedRights(e.target.checked)}
          type="checkbox"
        />
        {copy.confirmLabel}
      </label>
      <DialogFooter className="mt-8 flex-col gap-3 sm:flex-row sm:justify-end">
        <Button disabled={isSubmitting} onClick={() => handleOpenChange(false)} size="md" type="button" variant="ghost">
          {copy.cancel}
        </Button>
        <Button
          aria-busy={isSubmitting || undefined}
          disabled={!hasConfirmedRights || isSubmitting}
          onClick={() => void handleSubmit()}
          size="md"
          type="button"
        >
          {isSubmitting ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {isSubmitting ? copy.submitting : copy.submit}
          {isSubmitting ? null : <ArrowUpRight aria-hidden />}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
