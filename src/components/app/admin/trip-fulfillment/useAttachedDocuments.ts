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
  const inFlight = useRef<Promise<boolean> | null>(null);
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
      inFlight.current = null;
    },
    [tripId],
  );
  const replace = useCallback((value: SetStateAction<TripDocumentDTO[]>) => {
    sequence.current++;
    controller.current?.abort();
    inFlight.current = null;
    requiredLinks.current.clear();
    setDocuments(value);
    setStatus("ready");
  }, []);
  const refresh = useCallback(
    (requiredId?: string): Promise<boolean> => {
      if (requiredId) requiredLinks.current.add(requiredId);
      if (inFlight.current) return inFlight.current;
      const token = ++sequence.current;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      setStatus("loading");
      const promise = (async () => {
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
        } finally {
          if (token === sequence.current) inFlight.current = null;
        }
      })();
      inFlight.current = promise;
      return promise;
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
