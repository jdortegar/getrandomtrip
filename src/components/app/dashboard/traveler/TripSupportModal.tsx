"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import { buildTripSupportMessage, canSendTripSupport } from "./tripSupportHelpers";

interface TripSupportModalProps {
  copy: Pick<TripItineraryDict, "support">;
  destination: string | null;
  onClose: () => void;
  open: boolean;
  startDate: string | null;
  tripId: string;
  user: { email: string | null; name: string | null };
}

/**
 * Traveler → support contact modal (design.md ADR-4). Reuses the existing
 * `POST /api/contact` endpoint unchanged (Resolved Decision #4): collects
 * only `message`, with `name`/`email` from the authenticated session and a
 * fixed `interest: "Trip support"` (not user-visible — it only lands in
 * the ops email subject). Mirrors `ContactTravelerModal`'s structure and
 * state machine 1:1.
 */
export function TripSupportModal({
  copy,
  destination,
  onClose,
  open,
  startDate,
  tripId,
  user,
}: TripSupportModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setSending(false);
    setError("");
    setSent(false);
  }, [open]);

  async function handleSend() {
    if (!canSendTripSupport(message, sending)) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        body: JSON.stringify({
          email: user.email ?? "",
          interest: "Trip support",
          message: buildTripSupportMessage(message.trim(), {
            destination,
            startDate,
            tripId,
          }),
          name: user.name ?? "",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError(copy.support.errorGeneric);
      }
    } catch {
      setError(copy.support.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      className="flex max-w-lg flex-col gap-0 overflow-hidden border-gray-200 p-0 sm:max-w-lg"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={open}
      showCloseButton
    >
      <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-light-blue/10">
            <MessageCircle className="h-4 w-4 text-light-blue" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {copy.support.heading}
            </DialogTitle>
            {user.email ? (
              <DialogDescription className="text-sm text-gray-500">
                {user.email}
              </DialogDescription>
            ) : null}
          </div>
        </div>
      </DialogHeader>

      {sent ? (
        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-neutral-900">{copy.support.successTitle}</p>
          <p className="mt-1 text-sm text-neutral-600">{copy.support.successBody}</p>
        </div>
      ) : (
        <div className="px-6 py-5">
          <p className="text-sm text-neutral-600">{copy.support.body}</p>
          <div className="mt-4">
            <TextAreaInput
              id="trip-support-message"
              label={copy.support.messageLabel}
              maxLength={4000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={copy.support.messagePlaceholder}
              value={message}
            />
          </div>
          {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        </div>
      )}

      <DialogFooter className="shrink-0 border-t border-gray-200 px-6 py-4 sm:justify-end">
        {sent ? (
          <Button onClick={onClose} size="sm" type="button" variant="default">
            {copy.support.close}
          </Button>
        ) : (
          <>
            <Button
              disabled={sending}
              onClick={onClose}
              size="sm"
              type="button"
              variant="secondary"
            >
              {copy.support.cancel}
            </Button>
            <Button
              disabled={sending || !canSendTripSupport(message, sending)}
              onClick={() => void handleSend()}
              size="sm"
              type="button"
              variant="default"
            >
              {sending ? copy.support.sending : copy.support.send}
            </Button>
          </>
        )}
      </DialogFooter>
    </Modal>
  );
}
