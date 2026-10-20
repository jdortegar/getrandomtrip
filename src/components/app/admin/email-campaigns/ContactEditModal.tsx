"use client";

import { useRef, useState, type FormEvent } from "react";
import { Save, UserPen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type {
  CampaignLocale,
  Contact,
  ContactUpdateInput,
  SegmentSummary,
  SegmentsLoadStatus,
} from "@/types/emailCampaign";
import { PendingButtonContent } from "./PendingButtonContent";
import { SegmentChipPicker } from "./SegmentChipPicker";
import { CONTACTS_API, readApiErrorCode, toggleSegmentId } from "./segmentApi";

interface ContactEditModalProps {
  contact: Contact;
  copy: EmailCampaignsAdminDict["contacts"]["edit"];
  localeLabels: EmailCampaignsAdminDict["locales"];
  onClose: () => void;
  onRetrySegments: () => void;
  onSaved: (contact: Contact) => void;
  pickerCopy: EmailCampaignsAdminDict["segments"]["picker"];
  segments: SegmentSummary[];
  segmentsStatus: SegmentsLoadStatus;
}

/**
 * Edits a contact's name, language and segment memberships (PATCH). Mount it
 * keyed by the contact id so each opening starts from the saved values.
 */
export function ContactEditModal({
  contact,
  copy,
  localeLabels,
  onClose,
  onRetrySegments,
  onSaved,
  pickerCopy,
  segments,
  segmentsStatus,
}: ContactEditModalProps) {
  const [name, setName] = useState(contact.name ?? "");
  const [locale, setLocale] = useState<CampaignLocale>(contact.locale);
  const [segmentIds, setSegmentIds] = useState(() =>
    contact.segments.map((segment) => segment.id),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  function failureMessage(status: number, code: string | null): string {
    if (code === "invalid_segment") return copy.errors.invalidSegment;
    if (status === 404) return copy.errors.notFound;
    if (status === 400) return copy.errors.invalid;
    return copy.errors.generic;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const body: ContactUpdateInput = {
      locale,
      name: name.trim() || null,
      segmentIds,
    };
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${CONTACTS_API}/${contact.id}`, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        setError(failureMessage(res.status, await readApiErrorCode(res)));
        return;
      }
      const data = (await res.json()) as { contact: Contact };
      onSaved(data.contact);
    } catch {
      setError(copy.errors.generic);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal
      className="flex max-w-lg flex-col gap-0 overflow-hidden border-gray-200 p-0 sm:max-w-lg"
      onOpenChange={(open) => {
        if (!open && !inFlight.current) onClose();
      }}
      open
      showCloseButton={!saving}
    >
      <form
        data-component="ContactEditModal"
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
      >
        <DialogHeader className="border-b border-gray-200 px-6 py-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10">
              <UserPen aria-hidden className="h-4 w-4 text-secondary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-semibold text-ink">{copy.title}</DialogTitle>
              <DialogDescription className="truncate text-sm text-neutral-500">
                {contact.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <FormField
            autoComplete="off"
            id="email-contact-edit-name"
            label={copy.name}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <FormSelectField
            id="email-contact-edit-locale"
            label={copy.locale}
            onChange={(event) => setLocale(event.target.value as CampaignLocale)}
            value={locale}
          >
            <option value="es">{localeLabels.es}</option>
            <option value="en">{localeLabels.en}</option>
          </FormSelectField>
          <div
            aria-describedby="email-contact-edit-segments-hint"
            aria-labelledby="email-contact-edit-segments-label"
            className="flex flex-col gap-2"
            role="group"
          >
            <span className="text-base text-gray-600" id="email-contact-edit-segments-label">
              {copy.segments}
            </span>
            <SegmentChipPicker
              copy={pickerCopy}
              onRetry={onRetrySegments}
              onToggle={(id) => setSegmentIds((ids) => toggleSegmentId(ids, id))}
              segments={segments}
              selectedIds={segmentIds}
              status={segmentsStatus}
            />
            <p className="text-xs text-neutral-500" id="email-contact-edit-segments-hint">
              {copy.segmentsHint}
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="border-t border-gray-200 px-6 py-4 sm:justify-end">
          <Button disabled={saving} onClick={onClose} size="sm" type="button" variant="secondary">
            {copy.cancel}
          </Button>
          <Button
            aria-busy={saving}
            disabled={saving || segmentsStatus !== "ready"}
            size="sm"
            type="submit"
          >
            <PendingButtonContent
              icon={Save}
              label={copy.save}
              pending={saving}
              pendingLabel={copy.saving}
            />
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
