"use client";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type { TripDocumentSourceSelection } from "@/lib/types/TripDocumentSource";
import { DocumentTemplatePicker } from "./DocumentTemplatePicker";
import { DocumentSourceFeedback } from "./DocumentSourceFeedback";
import { DocumentActionButton } from "./DocumentActionButton";
import type { useDocumentDrafts } from "./useDocumentDrafts";
import styles from "./fulfillment.module.css";

interface Props {
  actions: MarketingDictionary["documentActions"];
  autoLoad: boolean;
  busy: boolean;
  closeLabel: string;
  copy: MarketingDictionary["documentDraftPanel"];
  drafts: ReturnType<typeof useDocumentDrafts>;
  onClose: () => void;
  onCreated: () => void;
  source?: TripDocumentSourceSelection;
  titles: Record<TripDocumentSnapshot["template"], string>;
  workflow: Pick<
    MarketingDictionary["documentWorkflow"],
    "sourceLoading" | "sourceError" | "retry"
  >;
}

/** Only creation follows source changes; an existing editor is never rebased. */
export function DocumentDraftCreation({
  actions,
  autoLoad,
  busy,
  closeLabel,
  copy,
  drafts,
  onClose,
  onCreated,
  source,
  titles,
  workflow,
}: Props) {
  const sourceBlocked = !!source && source.status !== "ready";
  return (
    <>
      {source && <DocumentSourceFeedback copy={workflow} source={source} />}
      {(drafts.error || drafts.operation?.kind === "list") && (
        <DocumentActionButton
          className={styles.btn}
          disabled={busy}
          onClick={() => void drafts.list()}
          pending={drafts.operation?.kind === "list"}
          pendingLabel={actions.loading}
          type="button"
        >
          {copy.load}
        </DocumentActionButton>
      )}
      <DocumentTemplatePicker
        busy={busy || (autoLoad && !drafts.loaded) || sourceBlocked}
        candidates={
          source
            ? (source.context?.candidates ?? {
                hotel: [],
                activity: [],
                dinner: [],
              })
            : drafts.candidates
        }
        copy={copy}
        creating={drafts.operation?.kind === "create"}
        creatingLabel={actions.creating}
        key={source?.key}
        onCreate={(template, candidate) => {
          if (sourceBlocked) return;
          void drafts.create(template, candidate).then((created) => {
            if (created) onCreated();
          });
        }}
        titles={titles}
      />
      <button
        className={styles.btn}
        disabled={busy}
        onClick={onClose}
        type="button"
      >
        {closeLabel}
      </button>
    </>
  );
}
