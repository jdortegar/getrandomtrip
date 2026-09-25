import type { PDFDocumentProxy } from "pdfjs-dist";
export interface PdfPreviewSession {
  document: PDFDocumentProxy;
  /** Rejects on cancellation or worker failure, including after document load. */
  failed: Promise<never>;
}
