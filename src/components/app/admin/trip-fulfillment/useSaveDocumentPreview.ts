"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type { useDocumentDrafts } from "./useDocumentDrafts";
import type { useDraftDelivery } from "./useDraftDelivery";
interface PreviewAction {
  scope: string;
  token: number;
  saved?: { id: string; revision: number };
}
/** One action owns save, revision adoption and render: no enabled gap between them. */
export function useSaveDocumentPreview(
  drafts: ReturnType<typeof useDocumentDrafts>,
  delivery: ReturnType<typeof useDraftDelivery>,
  sourceKey = "",
) {
  const scope = JSON.stringify([
    drafts.selected?.tripRequestId,
    drafts.selected?.id,
    sourceKey,
  ]);
  const [pendingAction, setPendingAction] = useState<PreviewAction | null>(
    null,
  );
  const [owner, setOwner] = useState(scope);
  if (owner !== scope) {
    setOwner(scope);
    setPendingAction(null);
  }
  const sequence = useRef(0);
  const locked = useRef(false);
  const started = useRef<number | null>(null);
  const { cancelRender } = delivery;
  useLayoutEffect(
    () => () => {
      sequence.current++;
      locked.current = false;
      cancelRender();
    },
    [scope, cancelRender],
  );

  useEffect(() => {
    const action = pendingAction;
    if (
      !action?.saved ||
      action.scope !== scope ||
      action.token !== sequence.current ||
      started.current === action.token
    )
      return;
    if (drafts.busy) return;
    started.current = action.token;
    void Promise.resolve()
      .then(async () => {
        if (action.token !== sequence.current) return;
        if (
          drafts.selected?.id === action.saved?.id &&
          drafts.selected?.revision === action.saved?.revision &&
          !drafts.dirty
        )
          await delivery.render();
      })
      .finally(() => {
        if (action.token === sequence.current) {
          locked.current = false;
          setPendingAction(null);
        }
      });
  }, [pendingAction, scope, drafts, delivery]);

  async function savePreview(value: TripDocumentSnapshot) {
    if (locked.current || drafts.busy || delivery.busy) return;
    locked.current = true;
    const token = ++sequence.current;
    setPendingAction({ scope, token });
    delivery.clearPreview();
    let scheduled = false;
    try {
      const saved = await drafts.save(value);
      if (saved && token === sequence.current) {
        scheduled = true;
        setPendingAction({
          scope,
          token,
          saved: { id: saved.id, revision: saved.revision },
        });
      }
    } finally {
      if (!scheduled && token === sequence.current) {
        locked.current = false;
        setPendingAction(null);
      }
    }
  }
  function cancelPending() {
    sequence.current++;
    locked.current = false;
    cancelRender();
    setPendingAction(null);
  }
  return {
    savePreview,
    cancelPending,
    pending: pendingAction?.scope === scope,
  };
}
