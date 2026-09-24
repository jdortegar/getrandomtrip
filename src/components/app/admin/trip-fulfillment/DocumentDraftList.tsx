"use client";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import type { TripDocumentDraftDto } from "@/lib/types/TripDocumentDraft";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type { MarketingDictionary } from "@/lib/types/dictionary";
interface Props {
  busy: boolean;
  copy: MarketingDictionary["documentDraftDelivery"];
  drafts: TripDocumentDraftDto[];
  onOpen: (id: string) => void;
  titles: Record<TripDocumentSnapshot["template"], string>;
}
export function DocumentDraftList({
  busy,
  copy,
  drafts,
  onOpen,
  titles,
}: Props) {
  return (
    <ul className="flex flex-col gap-3">
      {drafts.map((item) => {
        const published =
          Boolean(item.documentId) && item.publishedRevision === item.revision;
        return (
          <li
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
            key={item.id}
          >
            <button
              className="min-w-0 text-left font-medium text-primary underline"
              data-open-draft
              disabled={busy}
              onClick={() => onOpen(item.id)}
              type="button"
            >
              {item.document.label || titles[item.document.template]}
            </button>
            <StatusIndicatorBadge
              label={
                !item.documentId
                  ? copy.draft
                  : published
                    ? copy.attached
                    : copy.unpublished
              }
              styles={{
                badge: published
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-200 bg-amber-50 text-amber-800",
                dot: published ? "bg-green-500" : "bg-amber-400",
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}
