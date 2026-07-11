"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Modal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Modal";
import type { AppDictionary } from "@/hooks/useDictionary";

interface Props {
  copy: AppDictionary["adminExperienceReview"];
  activeSaving: "approve" | "reject" | "edit" | "send" | "discard" | null;
  allPricesFilled: boolean;
  /** If set, a review copy exists — shows discard/send instead of reject/edit/approve. */
  adminCopyId?: string | null;
  error: string | null;
  lockedByOther: boolean;
  reviewNote: string;
  saving: boolean;
  onApprove: (note: string) => void;
  onReject: () => void;
  onStartEdit: () => void;
  onSendToTripper: (note: string) => void;
  onDiscardCopy: () => void;
  onReviewNoteChange: (value: string) => void;
}

const textareaClass =
  "flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:opacity-50";

/** Final approve/reject decision only — sticky top bar, same treatment as the tripper's own review actions. Edit/discard/send stay with the regular Admin tab content. */
export function AdminReviewActionsBar({
  copy,
  activeSaving,
  allPricesFilled,
  adminCopyId,
  error,
  lockedByOther,
  reviewNote,
  saving,
  onApprove,
  onReject,
  onStartEdit,
  onSendToTripper,
  onDiscardCopy,
  onReviewNoteChange,
}: Props) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [approveNote, setApproveNote] = useState("");
  const [sendNote, setSendNote] = useState("");

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        {adminCopyId ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={onDiscardCopy}
              disabled={saving}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              {activeSaving === "discard" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {copy.discardChanges}
            </Button>
            <Button size="sm" onClick={() => setShowSendConfirm(true)} disabled={saving}>
              {activeSaving === "send" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {copy.sendToTripper}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowRejectConfirm(true)}
              disabled={saving}
              className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <X className="h-4 w-4" />
              {copy.reject}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onStartEdit}
              disabled={saving || lockedByOther}
              className="gap-2"
            >
              {activeSaving === "edit" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              {copy.editExperience}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowApproveConfirm(true)}
              disabled={!allPricesFilled || saving || lockedByOther}
            >
              {activeSaving === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                copy.approve
              )}
            </Button>
          </>
        )}
      </div>

      <Modal
        open={showSendConfirm}
        onOpenChange={setShowSendConfirm}
        showCloseButton
        className="max-w-md"
      >
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-light-blue/10">
            <Send className="h-5 w-5 text-light-blue" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {copy.sendConfirmTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            {copy.sendConfirmBody}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-1.5">
          <label htmlFor="send-note" className="text-sm font-medium text-gray-700">
            {copy.noteLabel}{" "}
            <span className="font-normal text-gray-400">{copy.noteOptional}</span>
          </label>
          <textarea
            id="send-note"
            rows={3}
            value={sendNote}
            onChange={(e) => setSendNote(e.target.value)}
            placeholder={copy.sendNotePlaceholder}
            disabled={saving}
            className={textareaClass}
          />
        </div>
        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowSendConfirm(false)}
            disabled={saving}
          >
            {copy.cancel}
          </Button>
          <Button
            onClick={() => {
              setShowSendConfirm(false);
              onSendToTripper(sendNote);
            }}
            disabled={saving}
          >
            {activeSaving === "send" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              copy.sendToTripper
            )}
          </Button>
        </DialogFooter>
      </Modal>

      <Modal
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        showCloseButton
        className="max-w-md"
      >
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-light-blue/10">
            <Check className="h-5 w-5 text-light-blue" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {copy.approveConfirmTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            {copy.approveConfirmBody}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-1.5">
          <label htmlFor="approve-note" className="text-sm font-medium text-gray-700">
            {copy.noteLabel}{" "}
            <span className="font-normal text-gray-400">{copy.noteOptional}</span>
          </label>
          <textarea
            id="approve-note"
            rows={3}
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            placeholder={copy.approveNotePlaceholder}
            disabled={saving}
            className={textareaClass}
          />
        </div>
        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowApproveConfirm(false)}
            disabled={saving}
          >
            {copy.cancel}
          </Button>
          <Button
            onClick={() => {
              setShowApproveConfirm(false);
              onApprove(approveNote);
            }}
            disabled={!allPricesFilled || saving || lockedByOther}
          >
            {activeSaving === "approve" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              copy.approve
            )}
          </Button>
        </DialogFooter>
      </Modal>

      <Modal
        open={showRejectConfirm}
        onOpenChange={(open) => {
          setShowRejectConfirm(open);
          if (!open) onReviewNoteChange("");
        }}
        showCloseButton
        className="max-w-md"
      >
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {copy.rejectConfirmTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            {copy.rejectConfirmBody}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-1.5">
          <label htmlFor="reject-note" className="text-sm font-medium text-gray-700">
            {copy.noteLabel}{" "}
            <span className="font-medium text-red-600">{copy.noteRequired}</span>
          </label>
          <textarea
            id="reject-note"
            rows={3}
            value={reviewNote}
            onChange={(e) => onReviewNoteChange(e.target.value)}
            placeholder={copy.notePlaceholder}
            disabled={saving}
            className={textareaClass}
          />
        </div>
        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowRejectConfirm(false);
              onReviewNoteChange("");
            }}
            disabled={saving}
          >
            {copy.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setShowRejectConfirm(false);
              onReject();
            }}
            disabled={!reviewNote.trim() || saving}
          >
            {activeSaving === "reject" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              copy.confirmReject
            )}
          </Button>
        </DialogFooter>
      </Modal>
    </div>
  );
}
