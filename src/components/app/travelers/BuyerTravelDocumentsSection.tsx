"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
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
  /** The buyer's live profile documents (`buyerNationalities` / `buyerVisas`). */
  initialValue: BuyerTravelDocuments;
  /** True for a cancelled trip: nothing is editable. */
  readOnly: boolean;
}

/**
 * The buyer's own nationalities and visas on the trip detail page. Linked =
 * live: they are the buyer's profile documents, so no roster lock applies and
 * they stay editable unless the trip was cancelled. Prompts the buyer while
 * no nationality is saved.
 */
export function BuyerTravelDocumentsSection({
  tripId,
  locale,
  copy,
  errorCopy,
  initialValue,
  readOnly,
}: BuyerTravelDocumentsSectionProps) {
  const [value, setValue] = useState<BuyerTravelDocuments>(initialValue);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const savingRef = useRef(false);

  const [savedNationalities, setSavedNationalities] = useState(
    initialValue.nationalities,
  );
  const missing = !readOnly && savedNationalities.length === 0;

  async function handleSave() {
    if (readOnly || savingRef.current) return;
    // A nationality is required, as at checkout.
    if (value.nationalities.length === 0) {
      setShowErrors(true);
      toast.error(errorCopy.nationalitiesRequired);
      return;
    }
    const payload: BuyerTravelDocuments = {
      nationalities: value.nationalities,
      visas: value.visas,
    };
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
      setSavedNationalities(next.nationalities);
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
        nationalitiesReadOnly={readOnly}
        onChange={setValue}
        showHelpers={!readOnly}
        showNationalitiesRequired={showErrors}
        value={value}
        visasReadOnly={readOnly}
      />

      {!readOnly && (
        <div>
          <Button
            aria-busy={saving}
            disabled={saving}
            onClick={() => void handleSave()}
            size="sm"
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
