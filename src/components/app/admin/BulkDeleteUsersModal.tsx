"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { MarketingDictionary } from "@/lib/types/dictionary";

const CONFIRM_WORD = "DELETE";

interface BulkDeleteUsersModalProps {
  copy: MarketingDictionary["adminUsers"];
  count: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}

/**
 * Bulk-delete gets a typed "DELETE" confirmation on top of the standard
 * modal — each account removal cascades across trips, payments, reviews,
 * and blog posts, so a single Cancel/Delete pair is too little friction
 * for the blast radius of deleting several accounts at once.
 */
export function BulkDeleteUsersModal({
  copy,
  count,
  isDeleting,
  onClose,
  onConfirm,
  open,
}: BulkDeleteUsersModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const canConfirm = confirmText === CONFIRM_WORD;

  return (
    <Modal
      className="flex max-w-md flex-col gap-0 overflow-hidden border-gray-200 p-0 sm:max-w-md"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setConfirmText("");
          onClose();
        }
      }}
      open={open}
      showCloseButton
    >
      <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {copy.bulkActions.confirmTitle.replace("{count}", String(count))}
          </DialogTitle>
        </div>
      </DialogHeader>

      <div className="px-6 py-5">
        <DialogDescription className="text-sm text-neutral-600">
          {copy.bulkActions.confirmBody}
        </DialogDescription>
        <label className="mt-4 block text-xs font-medium text-neutral-500">
          {copy.bulkActions.typeToConfirmLabel}
        </label>
        <input
          className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-300 focus:outline-none"
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={copy.bulkActions.typeToConfirmPlaceholder}
          type="text"
          value={confirmText}
        />
      </div>

      <DialogFooter className="shrink-0 border-t border-gray-200 px-6 py-4 sm:justify-end">
        <Button
          disabled={isDeleting}
          onClick={onClose}
          size="sm"
          type="button"
          variant="secondary"
        >
          {copy.bulkActions.cancel}
        </Button>
        <Button
          disabled={isDeleting || !canConfirm}
          onClick={onConfirm}
          size="sm"
          type="button"
          variant="destructive"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {copy.bulkActions.confirm}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
