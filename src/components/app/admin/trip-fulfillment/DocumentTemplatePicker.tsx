"use client";
import { FormSelectField } from "@/components/ui/FormField";
import { useState } from "react";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type { DocumentProviderCandidate } from "@/lib/types/DocumentProviderCandidate";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";
interface Props {
  busy: boolean;
  candidates: Record<
    "hotel" | "activity" | "dinner",
    DocumentProviderCandidate[]
  >;
  copy: MarketingDictionary["documentDraftPanel"];
  onCreate: (
    template: TripDocumentSnapshot["template"],
    candidate?: number,
  ) => void;
  titles: Record<TripDocumentSnapshot["template"], string>;
}
export function DocumentTemplatePicker({
  busy,
  candidates,
  copy,
  onCreate,
  titles,
}: Props) {
  const [template, setTemplate] =
    useState<TripDocumentSnapshot["template"]>("hotel-voucher");
  const [candidate, setCandidate] = useState("");
  const role =
    template === "hotel-voucher"
      ? "hotel"
      : template === "activity-voucher"
        ? "activity"
        : template === "dinner-voucher"
          ? "dinner"
          : null;
  const providers = role ? candidates[role] : [];
  return (
    <div className="flex flex-col gap-5">
      <FormSelectField
        id="document-template"
        label={copy.template}
        className="rounded border border-gray-200 p-3"
        disabled={busy}
        onChange={(event) => {
          setTemplate(event.target.value as typeof template);
          setCandidate("");
        }}
        value={template}
      >
        {Object.entries(titles).map(([key, title]) => (
          <option key={key} value={key}>
            {title}
          </option>
        ))}
      </FormSelectField>
      {providers.length > 0 && (
        <FormSelectField
          id="document-source-provider"
          label={copy.provider}
          className="rounded border border-gray-200 p-3"
          disabled={busy}
          onChange={(event) => setCandidate(event.target.value)}
          value={candidate}
        >
          <option value="">{copy.none}</option>
          {providers.map((item) => (
            <option key={item.index} value={item.index}>
              {item.title}
            </option>
          ))}
        </FormSelectField>
      )}
      <p className="text-sm text-neutral-500">{copy.sourceNote}</p>
      <button
        className={`${styles.btn} ${styles.btnPrimary}`}
        disabled={busy}
        onClick={() =>
          onCreate(template, candidate === "" ? undefined : Number(candidate))
        }
        type="button"
      >
        {copy.create}
      </button>
    </div>
  );
}
