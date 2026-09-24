"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import type { TripDocumentDTO } from "@/types/tripDocument";
/** Published-document state is independent from editable trip/draft snapshots. */
export function useAttachedDocuments(tripId: string) {
  const [documents, setDocuments] = useState<TripDocumentDTO[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [owner, setOwner] = useState(tripId);
  const sequence = useRef(0);
  const requiredLinks = useRef(new Set<string>());
  const controller = useRef<AbortController | null>(null);
  if (owner !== tripId) {
    setOwner(tripId);
    setDocuments([]);
    setStatus("idle");
  }
  useEffect(
    () => () => {
      sequence.current++;
      requiredLinks.current.clear();
      controller.current?.abort();
    },
    [tripId],
  );
  const replace = useCallback((value: SetStateAction<TripDocumentDTO[]>) => {
    sequence.current++;
    controller.current?.abort();
    requiredLinks.current.clear();
    setDocuments(value);
    setStatus("ready");
  }, []);
  const refresh = useCallback(
    async (requiredId?: string): Promise<boolean> => {
      if (requiredId) requiredLinks.current.add(requiredId);
      const token = ++sequence.current;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      setStatus("loading");
      try {
        const response = await fetch(
          `/api/admin/trip-requests/${encodeURIComponent(tripId)}`,
          { cache: "no-store", signal: abort.signal },
        );
        if (!response.ok) throw new Error("documents_unavailable");
        const body = await response.json();
        if (token !== sequence.current) return false;
        if (
          !Array.isArray(body.documents) ||
          [...requiredLinks.current].some(
            (id) =>
              !body.documents.some(
                (document: TripDocumentDTO) => document.id === id,
              ),
          )
        )
          throw new Error("documents_unavailable");
        requiredLinks.current.clear();
        setDocuments(body.documents);
        setStatus("ready");
        return true;
      } catch {
        if (token === sequence.current) setStatus("error");
        return false;
      }
    },
    [tripId],
  );
  const ensure = useCallback(
    async (documentId: string) => {
      if (documents.some((document) => document.id === documentId)) return true;
      return refresh(documentId);
    },
    [documents, refresh],
  );
  return { documents, status, refresh, replace, ensure };
}
