"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDocumentDTO } from "@/types/tripDocument";

type Copy = Pick<
  TripItineraryDict,
  | "documentsTitle"
  | "documentsNote"
  | "documentsCancelledNote"
  | "documentsEmpty"
  | "view"
  | "download"
>;

interface TripDocumentsSectionProps {
  copy: Copy;
  documents: TripDocumentDTO[];
  status: string;
}

/**
 * View/download only, wired to the authenticated document route
 * (`doc.href` / `doc.downloadHref`) — never a raw blob URL (Resolved
 * Decision #1). Renders `documentsCancelledNote` instead of `documentsNote`
 * when the trip is CANCELLED, so a cancelled trip showing vouchers doesn't
 * read as a bug (design.md ADR-6 widening).
 */
export function TripDocumentsSection({
  copy,
  documents,
  status,
}: TripDocumentsSectionProps) {
  const note = status === "CANCELLED" ? copy.documentsCancelledNote : copy.documentsNote;

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h4 className="mb-1 text-sm font-semibold text-neutral-900">
        {copy.documentsTitle}
      </h4>
      <p className="mb-4 text-xs text-gray-500">{note}</p>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">{copy.documentsEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate text-sm font-medium text-neutral-900">
                  {doc.label}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild size="sm" variant="ghost">
                  <a href={doc.href} target="_blank" rel="noopener noreferrer">
                    {copy.view}
                  </a>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <a href={doc.downloadHref}>{copy.download}</a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
