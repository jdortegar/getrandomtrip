"use client";
import { useEffect, useRef, useState } from "react";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type { useDocumentDrafts } from "./useDocumentDrafts";
import type { useDraftDelivery } from "./useDraftDelivery";
export function useSaveDocumentPreview(
  drafts: ReturnType<typeof useDocumentDrafts>,
  delivery: ReturnType<typeof useDraftDelivery>,
) {
  const [pendingRender, setPendingRender] = useState<{
    id: string;
    revision: number;
  } | null>(null);
  const action = useRef(0);
  useEffect(() => {
    if (!pendingRender) return;
    if (
      drafts.selected?.id === pendingRender.id &&
      drafts.selected.revision === pendingRender.revision &&
      !drafts.dirty &&
      !drafts.busy
    ) {
      let active = true;
      void Promise.resolve().then(() => {
        if (active) {
          setPendingRender(null);
          void delivery.render();
        }
      });
      return () => {
        active = false;
      };
    }
  }, [pendingRender, drafts, delivery]);
  async function savePreview(value: TripDocumentSnapshot) {
    const token = ++action.current;
    const saved = await drafts.save(value);
    if (saved && token === action.current)
      setPendingRender({ id: saved.id, revision: saved.revision });
  }
  function cancelPending() {
    action.current++;
    setPendingRender(null);
  }
  return { savePreview, cancelPending };
}
