"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { DESTINATION_COUNTRY_CODES } from "@/lib/trips/destinationCountries";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";

interface AddTripDocumentFormProps {
  copy: MarketingDictionary["adminTripFulfillment"];
  countryLabels: Record<string, string>;
  errorMessage: string | null;
  onSubmit: (input: { label: string; country: string; file: File }) => Promise<void>;
  submitting: boolean;
}

/** Label text input, destination-country select from the full 24-country
 * catalog, PDF/JPG/PNG file input capped at 10MB — matches the admin
 * prototype's Add-a-Document form (design.md). */
export function AddTripDocumentForm({
  copy,
  countryLabels,
  errorMessage,
  onSubmit,
  submitting,
}: AddTripDocumentFormProps) {
  const [label, setLabel] = useState("");
  const [country, setCountry] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!label.trim() || !country || !file) return;
    await onSubmit({ label: label.trim(), country, file });
    setLabel("");
    setCountry("");
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form className={styles.addDoc} onSubmit={handleSubmit}>
      <p className={styles.addDocTitle}>{copy.addDocument.title}</p>

      <div className={styles.addDocGrid}>
        <FormField
          id="add-document-label"
          label={copy.addDocument.label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={copy.addDocument.labelPlaceholder}
          type="text"
          value={label}
        />

        <FormSelectField
          id="add-document-country"
          label={copy.addDocument.country}
          onChange={(e) => setCountry(e.target.value)}
          value={country}
        >
          <option value="">{copy.addDocument.countryPlaceholder}</option>
          {DESTINATION_COUNTRY_CODES.map((code) => (
            <option key={code} value={code}>
              {countryLabels[code] ?? code}
            </option>
          ))}
        </FormSelectField>
      </div>

      <label className={styles.dropzone} htmlFor="add-document-file">
        <UploadCloud />
        <span className={styles.dropzoneTitle}>
          {fileName ?? copy.addDocument.file}
        </span>
        <span className={styles.dropzoneCaption}>{copy.addDocument.fileHint}</span>
        <input
          accept="application/pdf,image/jpeg,image/png"
          className="sr-only"
          id="add-document-file"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          ref={fileInputRef}
          type="file"
        />
      </label>

      {errorMessage ? <p className={styles.dangerCopy}>{errorMessage}</p> : null}

      <div className={styles.addDocActions}>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={submitting || !label.trim() || !country}
          type="submit"
        >
          {submitting ? copy.addDocument.submitting : copy.addDocument.submit}
        </button>
      </div>
    </form>
  );
}
