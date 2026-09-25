"use client";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { DocumentActionButton } from "./DocumentActionButton";
import styles from "./fulfillment.module.css";
interface Props {
  busy: boolean;
  copy: MarketingDictionary["documentDraftPanel"];
  deleting: boolean;
  deletingLabel: string;
  dirty: boolean;
  moreLabel: string;
  onDelete: () => void;
}
export function DocumentDraftActions({
  busy,
  copy,
  deleting,
  deletingLabel,
  dirty,
  moreLabel,
  onDelete,
}: Props) {
  return (
    <>
      <details className="self-end">
        <summary className="cursor-pointer text-sm text-neutral-500">
          {moreLabel}
        </summary>
        <DocumentActionButton
          className={styles.btn}
          disabled={busy}
          onClick={() => {
            if (window.confirm(copy.deleteConfirm)) onDelete();
          }}
          pending={deleting}
          pendingLabel={deletingLabel}
          type="button"
        >
          {copy.delete}
        </DocumentActionButton>
      </details>
      {!dirty && !busy && (
        <p className="text-sm text-neutral-500" role="status">
          {copy.saved}
        </p>
      )}
    </>
  );
}
