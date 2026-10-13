"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { TravelerDocumentsFields } from "@/components/app/travelers/TravelerDocumentsFields";
import { Button } from "@/components/ui/Button";
import type { TripDetailBuyerDocumentsDict } from "@/lib/types/dictionary";
import type { BuyerTravelDocuments } from "@/types/documents";

interface BuyerTravelDocumentsSectionProps {
  tripId: string;
  locale: string;
  copy: TripDetailBuyerDocumentsDict;
  /** Shared with checkout: required-nationality and save-failure messages. */
  errorCopy: { nationalitiesRequired: string; saveTravelDocumentsFailed: string };
  /** The trip's buyer snapshot as last saved. */
  initialValue: BuyerTravelDocuments;
  /** True once the trip is no longer active (cancelled, completed): nothing is editable. */
  readOnly: boolean;
  /**
   * True once the roster locked: saved lists are frozen, empty ones can still
   * be filled (the companions' rule).
   */
  locked: boolean;
}

/**
 * The buyer's own nationalities and visas on the trip detail page. Editable
 * until the roster locks; prompts the buyer while nothing is saved (trips
 * paid before travel documents were collected at checkout).
 */
export function BuyerTravelDocumentsSection({
  tripId,
  locale,
  copy,
  errorCopy,
  initialValue,
  readOnly,
  locked,
}: BuyerTravelDocumentsSectionProps) {
  const [value, setValue] = useState<BuyerTravelDocuments>(initialValue);
  const [saved, setSaved] = useState<BuyerTravelDocuments>(initialValue);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const savingRef = useRef(false);

  const nationalitiesEditable =
    !readOnly && (!locked || saved.nationalities.length === 0);
  const visasEditable = !readOnly && (!locked || saved.visas.length === 0);
  const anyEditable = nationalitiesEditable || visasEditable;
  const missing = nationalitiesEditable && saved.nationalities.length === 0;

  async function handleSave() {
    if (savingRef.current) return;
    // Only editable lists are sent: both before the lock, the still-empty ones
    // after it. An editable nationality list is required (as at checkout);
    // once nationalities are saved and frozen, visas alone can be filled.
    if (nationalitiesEditable && value.nationalities.length === 0) {
      setShowErrors(true);
      toast.error(errorCopy.nationalitiesRequired);
      return;
    }
    const payload: Partial<BuyerTravelDocuments> = {
      ...(nationalitiesEditable && { nationalities: value.nationalities }),
      ...(visasEditable && { visas: value.visas }),
    };
    if (payload.nationalities === undefined && payload.visas === undefined) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/trips/${encodeURIComponent(tripId)}/buyer-documents`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        toast.error(errorCopy.saveTravelDocumentsFailed);
        return;
      }
      const data = (await response.json()) as {
        buyerNationalities: string[];
        buyerVisas: string[];
      };
      const next = { nationalities: data.buyerNationalities, visas: data.buyerVisas };
      setValue(next);
      setSaved(next);
      toast.success(copy.savedToast);
    } catch {
      toast.error(errorCopy.saveTravelDocumentsFailed);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <section
      className="flex flex-col gap-6"
      data-component="BuyerTravelDocumentsSection"
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
          {copy.title}
        </h3>
        <p className="text-sm text-neutral-500">{copy.description}</p>
      </div>

      {missing && (
        <div
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          role="status"
        >
          <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-semibold text-amber-900">{copy.missingTitle}</p>
            <p className="text-sm text-amber-800">{copy.missingDescription}</p>
          </div>
        </div>
      )}

      <TravelerDocumentsFields
        idPrefix="buyer-documents"
        locale={locale}
        nationalitiesReadOnly={!nationalitiesEditable}
        onChange={setValue}
        showHelpers={anyEditable}
        showNationalitiesRequired={showErrors}
        value={value}
        visasReadOnly={!visasEditable}
      />

      {(readOnly || locked) && (
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          <Lock aria-hidden className="h-4 w-4" />
          {anyEditable ? copy.partiallyLockedNote : copy.lockedNote}
        </p>
      )}
      {anyEditable && (
        <div>
          <Button
            aria-busy={saving}
            disabled={saving}
            onClick={() => void handleSave()}
            size="lg"
            variant="default"
          >
            {saving && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
            {saving ? copy.savingAction : copy.saveAction}
          </Button>
        </div>
      )}
    </section>
  );
}
