"use client";
import { Button } from "@/components/ui/Button";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import styles from "./fulfillment.module.css";
interface Props {
  busy: boolean;
  published: boolean;
  copy: MarketingDictionary["documentDraftDelivery"];
  backLabel: string;
  linkedId?: string | null;
  onAttach: (id?: string) => void;
  onBack: () => void;
  url: string;
}
export function DocumentDraftReview({
  busy,
  published,
  copy,
  backLabel,
  linkedId,
  onAttach,
  onBack,
  url,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <p className="text-sm text-neutral-500">{copy.memoryNotice}</p>
      <Button asChild variant="ghost">
        <a
          className="text-primary underline"
          href={url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {copy.view}
        </a>
      </Button>
      <iframe
        className="h-[60dvh] w-full rounded border border-gray-200"
        src={url}
        title={copy.preview}
      />
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-white py-4">
        <button
          className={styles.btn}
          disabled={busy}
          onClick={onBack}
          type="button"
        >
          {backLabel}
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={busy || published}
          onClick={() => {
            if (!linkedId || window.confirm(copy.confirmReplace))
              onAttach(linkedId ?? undefined);
          }}
          type="button"
        >
          {published ? copy.attached : linkedId ? copy.replace : copy.attach}
        </button>
      </div>
    </div>
  );
}
