"use client";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { useDocumentDrafts } from "./useDocumentDrafts";
import type { useDraftDelivery } from "./useDraftDelivery";
import styles from "./fulfillment.module.css";
interface Props {
  busy: boolean;
  dictionary: Pick<
    MarketingDictionary,
    "documentDraftPanel" | "documentDraftDelivery" | "documentWorkflow"
  >;
  drafts: ReturnType<typeof useDocumentDrafts>;
  delivery: ReturnType<typeof useDraftDelivery>;
  onReload: () => void;
  refreshFailed: boolean;
  refreshPublished: () => Promise<void>;
}
export function DocumentDraftFeedback({
  busy,
  dictionary,
  drafts,
  delivery,
  onReload,
  refreshFailed,
  refreshPublished,
}: Props) {
  const copy = dictionary.documentDraftPanel;
  const deliveryCopy = dictionary.documentDraftDelivery;
  const workflow = dictionary.documentWorkflow;
  return (
    <>
      {busy && <p role="status">{copy.pending}</p>}
      {drafts.error && (
        <p role="alert">
          {drafts.error === "conflict" ? copy.conflict : copy.error}
        </p>
      )}
      {drafts.error === "conflict" && drafts.selected && (
        <button
          className={styles.btn}
          onClick={() => {
            onReload();
          }}
          type="button"
        >
          {copy.reload}
        </button>
      )}
      {refreshFailed && (
        <div role="alert">
          <p>{workflow.refreshError}</p>
          <button
            className={styles.btn}
            onClick={() => void refreshPublished()}
            type="button"
          >
            {workflow.retry}
          </button>
        </div>
      )}
      {delivery.attachedId && <p role="status">{deliveryCopy.attached}</p>}
      {delivery.error && <p role="alert">{deliveryCopy[delivery.error]}</p>}
      {delivery.error === "attach_request_expired" && (
        <button
          className={styles.btn}
          onClick={() => {
            if (window.confirm(deliveryCopy.resetConfirm))
              delivery.resetExpiredRequest();
          }}
          type="button"
        >
          {deliveryCopy.reset}
        </button>
      )}
    </>
  );
}
