"use client";

import { useRef, useState, type FormEvent } from "react";
import { Layers, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import {
  MAX_SEGMENT_DESCRIPTION_LENGTH,
  MAX_SEGMENT_NAME_LENGTH,
} from "@/lib/email-campaigns/segmentRules";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { Segment, SegmentInput, SegmentSummary } from "@/types/emailCampaign";
import { PendingButtonContent } from "./PendingButtonContent";
import { readApiErrorCode, SEGMENTS_API } from "./segmentApi";

interface SegmentFormModalProps {
  copy: EmailCampaignsAdminDict["segments"]["form"];
  onClose: () => void;
  onSaved: (segment: Segment) => void;
  /** The segment to rename / describe; omit to create a new one. */
  segment?: SegmentSummary;
}

/**
 * Creates (POST) or edits (PATCH) a segment. Mount it keyed by the segment id
 * so each opening starts from the saved values.
 */
export function SegmentFormModal({ copy, onClose, onSaved, segment }: SegmentFormModalProps) {
  const [name, setName] = useState(segment?.name ?? "");
  const [description, setDescription] = useState(segment?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  function failureMessage(status: number, code: string | null): string {
    if (code === "duplicate_segment") return copy.errors.duplicate;
    if (status === 404) return copy.errors.notFound;
    if (status === 400) return copy.errors.invalid;
    return copy.errors.generic;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const body: SegmentInput = {
      description: description.trim() || null,
      name: name.trim(),
    };
    if (!body.name) {
      setError(copy.errors.nameRequired);
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(segment ? `${SEGMENTS_API}/${segment.id}` : SEGMENTS_API, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: segment ? "PATCH" : "POST",
      });
      if (!res.ok) {
        setError(failureMessage(res.status, await readApiErrorCode(res)));
        return;
      }
      const data = (await res.json()) as { segment: Segment };
      onSaved(data.segment);
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
        data-component="SegmentFormModal"
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
      >
        <DialogHeader className="border-b border-gray-200 px-6 py-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10">
              <Layers aria-hidden className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-ink">
                {segment ? copy.editTitle : copy.createTitle}
              </DialogTitle>
              {segment?.systemKey && (
                <DialogDescription className="text-sm text-neutral-500">
                  {copy.systemHint}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <FormField
            autoComplete="off"
            id="email-segment-name"
            label={copy.name}
            maxLength={MAX_SEGMENT_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <TextAreaInput
            id="email-segment-description"
            label={copy.description}
            maxLength={MAX_SEGMENT_DESCRIPTION_LENGTH}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
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
          <Button aria-busy={saving} disabled={saving} size="sm" type="submit">
            <PendingButtonContent
              icon={segment ? Save : Plus}
              label={segment ? copy.save : copy.create}
              pending={saving}
              pendingLabel={segment ? copy.saving : copy.creating}
            />
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
