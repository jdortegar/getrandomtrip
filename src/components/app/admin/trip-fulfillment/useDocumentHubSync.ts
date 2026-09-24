"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { useDocumentDrafts } from "./useDocumentDrafts";
import type { useDraftDelivery } from "./useDraftDelivery";
interface Props {
  drafts: ReturnType<typeof useDocumentDrafts>;
  delivery: ReturnType<typeof useDraftDelivery>;
  attachmentVersion: number;
  onAttached?: () => void | Promise<unknown>;
  onEnsureAttached?: (id: string) => Promise<unknown>;
}
export function useDocumentHubSync({
  drafts,
  delivery,
  attachmentVersion,
  onAttached,
  onEnsureAttached,
}: Props) {
  const [refreshFailed, setRefreshFailed] = useState(false);
  const refreshPublished = useCallback(async () => {
    try {
      setRefreshFailed((await onAttached?.()) === false);
    } catch {
      setRefreshFailed(true);
    }
  }, [onAttached]);
  const notified = useRef<string | null>(null);
  const ensured = useRef(new Set<string>());
  const version = useRef(attachmentVersion);
  useEffect(() => {
    if (version.current !== attachmentVersion) {
      version.current = attachmentVersion;
      void drafts.list();
    }
  }, [attachmentVersion, drafts]);
  useEffect(() => {
    for (const row of drafts.drafts) {
      if (row.documentId && !ensured.current.has(row.documentId)) {
        ensured.current.add(row.documentId);
        void onEnsureAttached?.(row.documentId);
      }
    }
  }, [drafts.drafts, onEnsureAttached]);
  useEffect(() => {
    if (
      delivery.publicationEvent &&
      notified.current !== delivery.publicationEvent
    ) {
      notified.current = delivery.publicationEvent;
      void refreshPublished();
      void drafts.list();
    }
  }, [delivery.publicationEvent, refreshPublished, drafts]);
  return { refreshFailed, refreshPublished };
}
