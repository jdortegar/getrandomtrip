"use client";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { useDocumentDrafts } from "./useDocumentDrafts";
import type { useDraftDelivery } from "./useDraftDelivery";
import styles from "./fulfillment.module.css";
import { DocumentActionButton } from "./DocumentActionButton";
interface Props {
  busy: boolean;
  dictionary: Pick<
    MarketingDictionary,
    | "documentDraftPanel"
    | "documentDraftDelivery"
    | "documentWorkflow"
    | "documentActions"
  >;
  drafts: ReturnType<typeof useDocumentDrafts>;
  delivery: ReturnType<typeof useDraftDelivery>;
  onReload: () => void;
  refreshFailed: boolean;
  refreshing: boolean;
  refreshPublished: () => Promise<void>;
}
export function DocumentDraftFeedback({
  busy,
  dictionary,
  drafts,
  delivery,
  onReload,
  refreshFailed,
  refreshing,
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
      {(drafts.error === "conflict" || drafts.operation?.kind === "reload") &&
        drafts.selected && (
          <DocumentActionButton
            className={styles.btn}
            disabled={busy}
            onClick={() => {
              onReload();
            }}
            pending={drafts.operation?.kind === "reload"}
            pendingLabel={dictionary.documentActions.reloading}
            type="button"
          >
            {copy.reload}
          </DocumentActionButton>
        )}
      {(refreshFailed || refreshing) && (
        <div role="alert">
          {refreshFailed && <p>{workflow.refreshError}</p>}
          <DocumentActionButton
            className={styles.btn}
            disabled={busy}
            onClick={() => void refreshPublished()}
            pending={refreshing}
            pendingLabel={dictionary.documentActions.refreshing}
            type="button"
          >
            {workflow.retry}
          </DocumentActionButton>
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
