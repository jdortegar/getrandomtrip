"use client";
import { Button } from "@/components/ui/Button";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";
import { DocumentActionButton } from "./DocumentActionButton";
import { DocumentPdfPreview } from "./DocumentPdfPreview";
interface Props {
  busy: boolean;
  operation?: "render" | "attach" | "replace" | null;
  actions: MarketingDictionary["documentActions"];
  published: boolean;
  copy: MarketingDictionary["documentDraftDelivery"];
  previewCopy: MarketingDictionary["documentPreview"];
  backLabel: string;
  linkedId?: string | null;
  onAttach: (id?: string) => void;
  onBack: () => void;
  url: string;
}
export function DocumentDraftReview({
  busy,
  actions,
  operation,
  published,
  copy,
  previewCopy,
  backLabel,
  linkedId,
  onAttach,
  onBack,
  url,
}: Props) {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden"
      data-component="DocumentDraftReview"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <p className="shrink-0 text-sm text-neutral-500">{copy.memoryNotice}</p>
        <Button asChild className="shrink-0" variant="ghost">
          <a
            className="text-primary underline"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {copy.view}
          </a>
        </Button>
        <div className="min-h-48 flex-1 overflow-hidden rounded border border-gray-200">
          <DocumentPdfPreview copy={previewCopy} url={url} />
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-gray-200 bg-white py-4">
        <button
          className={styles.btn}
          disabled={busy}
          onClick={onBack}
          type="button"
        >
          {backLabel}
        </button>
        <DocumentActionButton
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={busy || published}
          onClick={() => {
            if (!linkedId || window.confirm(copy.confirmReplace))
              onAttach(linkedId ?? undefined);
          }}
          pending={operation === "attach" || operation === "replace"}
          pendingLabel={
            operation === "replace" ? actions.replacing : actions.attaching
          }
          type="button"
        >
          {published ? copy.attached : linkedId ? copy.replace : copy.attach}
        </DocumentActionButton>
      </div>
    </div>
  );
}
