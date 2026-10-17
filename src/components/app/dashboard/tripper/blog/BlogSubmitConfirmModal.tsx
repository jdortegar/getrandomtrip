"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { TripperBlogFormDict } from "@/lib/types/dictionary";
import type { FinalizeCopy } from "./newBlogPostShellHelpers";

interface BlogSubmitConfirmModalProps {
  confirm: FinalizeCopy;
  dict: TripperBlogFormDict;
  isFinishing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onNoteChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showTripperNoteField: boolean;
  submitNote: string;
}

export function BlogSubmitConfirmModal({
  confirm,
  dict,
  isFinishing,
  onCancel,
  onConfirm,
  onNoteChange,
  onOpenChange,
  open,
  showTripperNoteField,
  submitNote,
}: BlogSubmitConfirmModalProps) {
  return (
    <Modal
      className="max-w-md"
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton
    >
      <DialogHeader>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
          <Check className="h-5 w-5 text-secondary" />
        </div>
        <DialogTitle className="font-bold text-2xl text-ink">
          {confirm.confirmTitle}
        </DialogTitle>
        <DialogDescription className="text-ink text-sm">
          {confirm.confirmBody}
        </DialogDescription>
      </DialogHeader>
      {showTripperNoteField && (
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="font-medium text-gray-700 text-sm" htmlFor="blog-submit-note">
            {dict.tripperNoteLabel}{" "}
            <span className="font-normal text-gray-400">{dict.tripperNoteOptional}</span>
          </label>
          <textarea
            className={cn(
              "bg-white border border-input flex px-3 py-2 resize-none rounded-md shadow-sm text-sm transition-colors w-full",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:opacity-50",
            )}
            disabled={isFinishing}
            id="blog-submit-note"
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={dict.tripperNotePlaceholder}
            rows={3}
            value={submitNote}
          />
          <p className="text-neutral-400 text-xs">{dict.tripperNoteHint}</p>
        </div>
      )}
      <DialogFooter className="mt-6">
        <Button disabled={isFinishing} onClick={onCancel} variant="secondary">
          {dict.cancel}
        </Button>
        <Button
          aria-busy={isFinishing}
          disabled={isFinishing}
          onClick={onConfirm}
        >
          {isFinishing ? (
            <>
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              {dict.saving}
            </>
          ) : (
            confirm.submitLabel
          )}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
