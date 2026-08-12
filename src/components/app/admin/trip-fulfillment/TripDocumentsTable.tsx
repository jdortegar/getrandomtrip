import { Eye, Download, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { TripDocumentDTO } from "@/types/tripDocument";
import styles from "./fulfillment.module.css";

interface TripDocumentsTableProps {
  copy: MarketingDictionary["adminTripFulfillment"];
  countryLabels: Record<string, string>;
  documents: TripDocumentDTO[];
  onRemove: (documentId: string) => void;
  removingId: string | null;
}

function formatUploaded(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FileIcon({ mimeType }: { mimeType: string }) {
  return mimeType === "application/pdf" ? <FileText /> : <ImageIcon />;
}

/** Document / Country / Uploaded / Actions — view/download via `doc.href`/`doc.downloadHref`. */
export function TripDocumentsTable({
  copy,
  countryLabels,
  documents,
  onRemove,
  removingId,
}: TripDocumentsTableProps) {
  if (documents.length === 0) {
    return <p className={styles.panelDesc}>{copy.documentsEmpty}</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.docsTable}>
        <thead>
          <tr>
            <th>{copy.documentsColumns.document}</th>
            <th>{copy.documentsColumns.country}</th>
            <th>{copy.documentsColumns.uploaded}</th>
            <th>{copy.documentsColumns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>
                <div className={styles.docCell}>
                  <span className={styles.filePuck}>
                    <FileIcon mimeType={doc.mimeType} />
                  </span>
                  <div>
                    <div className={styles.docTitle}>{doc.label}</div>
                    <div className={styles.docMeta}>{doc.originalFilename}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`${styles.chip} ${styles.chipCountry}`}>
                  {countryLabels[doc.country] ?? doc.country}
                </span>
              </td>
              <td>{formatUploaded(doc.createdAt)}</td>
              <td>
                <div className={styles.rowActions}>
                  <a
                    className={styles.iconBtn}
                    href={doc.href}
                    rel="noopener noreferrer"
                    target="_blank"
                    title={copy.view}
                  >
                    <Eye />
                  </a>
                  <a className={styles.iconBtn} href={doc.downloadHref} title={copy.download}>
                    <Download />
                  </a>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    disabled={removingId === doc.id}
                    onClick={() => onRemove(doc.id)}
                    title={copy.remove}
                    type="button"
                  >
                    <Trash2 />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
