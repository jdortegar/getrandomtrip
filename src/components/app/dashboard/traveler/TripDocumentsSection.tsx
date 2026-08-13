"use client";

import { Download, Eye, FileText, Image as ImageIcon, Shield } from "lucide-react";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDocumentDTO } from "@/types/tripDocument";
import { SectionHead } from "./SectionHead";
import styles from "./traveler-trip-details.module.css";

type Copy = Pick<
  TripItineraryDict,
  "documentsNote" | "documentsCancelledNote" | "documentsEmpty" | "view" | "download" | "documents"
>;

interface TripDocumentsSectionProps {
  copy: Copy;
  documents: TripDocumentDTO[];
  status: string;
}

/** MIME-type-derived tag only (Resolved Decision #3) — never a fabricated
 * confirmation number, room-type name, or date range. */
function tagForMimeType(mimeType: string): string {
  const [type, subtype] = mimeType.split("/");
  if (type === "image") return (subtype ?? "img").toUpperCase();
  if (mimeType === "application/pdf") return "PDF";
  return (subtype ?? type ?? "file").toUpperCase();
}

function formatDocDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * `.docGrid` / `.docCard` restyle of the documents section (design.md
 * ADR-2, ADR-3). View/Download stop going through `<Button asChild>` and
 * become raw `<a className={styles.btn}>` — the same call the admin
 * fulfillment header already shipped through review (ADR-2). Populates
 * strictly from `TripDocumentDTO`: label, country tag, mimeType-derived
 * tag, upload date — never a fabricated confirmation number, room-type
 * name, or date range (Resolved Decision #3). Props and the
 * `TripDocumentDTO` contract are unchanged; only the markup is.
 */
export function TripDocumentsSection({ copy, documents, status }: TripDocumentsSectionProps) {
  const note = status === "CANCELLED" ? copy.documentsCancelledNote : copy.documentsNote;

  return (
    <section className={styles.block} id="documents">
      <SectionHead
        eyebrow={copy.documents.eyebrow}
        heading={copy.documents.heading}
        lede={copy.documents.lede}
      />

      <div className={styles.docNote}>
        <Shield aria-hidden="true" />
        {note}
      </div>

      {documents.length === 0 ? (
        <p className={styles.lede}>{copy.documentsEmpty}</p>
      ) : (
        <div className={styles.docGrid}>
          {documents.map((doc) => {
            const Icon = doc.mimeType.startsWith("image/") ? ImageIcon : FileText;
            const tag = tagForMimeType(doc.mimeType);

            return (
              <div className={styles.docCard} key={doc.id}>
                <div className={styles.docCardIcon}>
                  <Icon aria-hidden="true" />
                </div>
                <div className={styles.docCardBody}>
                  <p className={styles.docCardTitle}>{doc.label}</p>
                  <p className={styles.docCardMeta}>
                    <span className={styles.docCardTag}>{tag}</span>
                    {doc.country} · {formatDocDate(doc.createdAt)}
                  </p>
                  <div className={styles.docCardActions}>
                    <a
                      className={`${styles.btn} ${styles.btnFill}`}
                      href={doc.href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Eye aria-hidden="true" />
                      {copy.view}
                    </a>
                    <a
                      aria-label={copy.download}
                      className={`${styles.btn} ${styles.btnIcon}`}
                      href={doc.downloadHref}
                    >
                      <Download aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
