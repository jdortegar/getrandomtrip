"use client";

import { Download, Eye, Shield } from "lucide-react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDocumentDTO } from "@/types/tripDocument";
import styles from "./traveler-trip-details.module.css";

type Copy = Pick<
  TripItineraryDict,
  "documentsNote" | "documentsCancelledNote" | "documentsEmpty" | "view" | "download" | "documents"
>;

interface TripDocumentsSectionProps {
  copy: Copy;
  documents: TripDocumentDTO[];
  locale: string;
  status: string;
}

const LOCALE_TAGS: Record<string, string> = { en: "en-US", es: "es-AR" };

/** MIME-type-derived tag only (Resolved Decision #3) — never a fabricated
 * confirmation number, room-type name, or date range. */
function tagForMimeType(mimeType: string): string {
  const [type, subtype] = mimeType.split("/");
  if (type === "image") return (subtype ?? "img").toUpperCase();
  if (mimeType === "application/pdf") return "PDF";
  return (subtype ?? type ?? "file").toUpperCase();
}

/** Upload date in the page's language, read as a calendar date (UTC) so it
 * never shifts a day in the traveler's time zone. */
function formatDocDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale] ?? LOCALE_TAGS.es, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * "Your documents", laid out like the guide's "The essentials. No detours."
 * (`.splitSection`): eyebrow, title, lede and privacy note on the left; one
 * hairline row per document on the right — index, label, type · country ·
 * date, and View / Download. Populates strictly from `TripDocumentDTO`.
 */
export function TripDocumentsSection({ copy, documents, locale, status }: TripDocumentsSectionProps) {
  const note = status === "CANCELLED" ? copy.documentsCancelledNote : copy.documentsNote;

  return (
    <section
      aria-labelledby="documents-heading"
      className={`${styles.block} ${styles.splitSection}`}
      data-component="TripDocumentsSection"
      id="documents"
    >
      <div>
        <p className={styles.eyebrow}>{copy.documents.eyebrow}</p>
        <h2 className={`${styles.sectionTitle} ${styles.cond}`} id="documents-heading">
          {copy.documents.heading}
        </h2>
        <p className={styles.splitBody}>{copy.documents.lede}</p>
        <p className={styles.docNote}>
          <Shield aria-hidden="true" />
          {note}
        </p>
      </div>

      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{copy.documentsEmpty}</p>
        </div>
      ) : (
        <ul className={styles.rowList}>
          {documents.map((doc, i) => (
            <li className={styles.docRow} key={doc.id}>
              <span className={styles.rowIndex}>{String(i + 1).padStart(2, "0")}</span>
              <div className={styles.docRowBody}>
                <p className={styles.docRowTitle}>{doc.label}</p>
                <p className={styles.docRowMeta}>
                  <span className={styles.docRowTag}>{tagForMimeType(doc.mimeType)}</span>
                  {doc.country} · {formatDocDate(doc.createdAt, locale)}
                </p>
              </div>
              <div className={styles.docRowActions}>
                <a
                  className={`${styles.btn} ${styles.btnFill}`}
                  href={doc.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Eye aria-hidden="true" />
                  {copy.view}
                </a>
                <a aria-label={copy.download} className={`${styles.btn} ${styles.btnIcon}`} href={doc.downloadHref}>
                  <Download aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
