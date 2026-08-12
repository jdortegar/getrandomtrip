"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import enDictionary from "@/dictionaries/en.json";
import esDictionary from "@/dictionaries/es.json";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import {
  buildPrefillBody,
  canSend,
  resolveContactLocale,
} from "./contactTravelerModalHelpers";

interface ContactTravelerModalProps {
  copy: MarketingDictionary["adminTripFulfillment"];
  onClose: () => void;
  open: boolean;
  traveler: { email: string; locale: string | null; name: string };
  tripId: string;
}

/**
 * Compose-and-send modal for the admin "Contact traveler" action. Follows
 * `UserRoleModal.tsx`'s structure (Modal/DialogHeader/DialogFooter shell,
 * icon puck, error line). The modal's own chrome (labels, buttons) renders
 * in the ADMIN's dashboard locale via `copy`; only the prefilled subject/body
 * are built in the TRAVELER's stored locale (Resolved Decision #10), so they
 * match the `EmailLayout` shell the email itself renders in.
 */
export function ContactTravelerModal({
  copy,
  onClose,
  open,
  traveler,
  tripId,
}: ContactTravelerModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const contactLocale = resolveContactLocale(traveler.locale);
    const prefillCopy =
      contactLocale === "en"
        ? enDictionary.adminTripFulfillment.contactModal
        : esDictionary.adminTripFulfillment.contactModal;
    setSubject(prefillCopy.prefillSubject);
    setBody(buildPrefillBody(prefillCopy.prefillBody, traveler.name));
    setSending(false);
    setError("");
    setSent(false);
  }, [open, traveler.locale, traveler.name]);

  async function handleSend() {
    if (!canSend(subject, body, sending)) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/trip-requests/${tripId}/contact`,
        {
          body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      if (res.ok) {
        setSent(true);
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        const errorKey = data.error as keyof typeof copy.errors | undefined;
        setError((errorKey && copy.errors[errorKey]) ?? copy.errors.generic);
      }
    } catch {
      setError(copy.errors.generic);
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
            <Mail className="h-4 w-4 text-light-blue" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {copy.contactModal.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {traveler.email}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {sent ? (
        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-neutral-900">
            {copy.contactModal.successTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {interpolateTemplate(copy.contactModal.successBody, {
              email: traveler.email,
            })}
          </p>
        </div>
      ) : (
        <div className="px-6 py-5">
          <p className="text-sm text-neutral-600">
            {interpolateTemplate(copy.contactModal.description, {
              userName: traveler.name,
            })}
          </p>
          <div className="mt-4 space-y-4">
            <FormField
              id="contact-subject"
              label={copy.contactModal.subjectLabel}
              maxLength={200}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={copy.contactModal.subjectPlaceholder}
              type="text"
              value={subject}
            />
            <TextAreaInput
              id="contact-body"
              label={copy.contactModal.bodyLabel}
              maxLength={4000}
              onChange={(e) => setBody(e.target.value)}
              placeholder={copy.contactModal.bodyPlaceholder}
              value={body}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
          )}
        </div>
      )}

      <DialogFooter className="shrink-0 border-t border-gray-200 px-6 py-4 sm:justify-end">
        {sent ? (
          <Button onClick={onClose} size="sm" type="button" variant="default">
            {copy.contactModal.close}
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
              {copy.contactModal.cancel}
            </Button>
            <Button
              disabled={sending || !canSend(subject, body, sending)}
              onClick={() => void handleSend()}
              size="sm"
              type="button"
              variant="default"
            >
              {sending ? copy.contactModal.sending : copy.contactModal.send}
            </Button>
          </>
        )}
      </DialogFooter>
    </Modal>
  );
}
