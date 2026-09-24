"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TripDocumentDraftDto } from "@/lib/types/TripDocumentDraft";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import type { DocumentProviderCandidate } from "@/lib/types/DocumentProviderCandidate";
interface Collection {
  drafts: TripDocumentDraftDto[];
  candidates: Record<
    "hotel" | "activity" | "dinner",
    DocumentProviderCandidate[]
  >;
}
type DraftError =
  | "conflict"
  | "forbidden"
  | "not_found"
  | "invalid"
  | "unavailable";
const empty: Collection = {
  drafts: [],
  candidates: { hotel: [], activity: [], dinner: [] },
};
export function useDocumentDrafts(tripId: string, autoLoad = false) {
  const [collection, setCollection] = useState<Collection>(empty);
  const [selected, setSelected] = useState<TripDocumentDraftDto | null>(null);
  const [document, setDocument] = useState<TripDocumentSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<DraftError | null>(null);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const [owner, setOwner] = useState(tripId);
  if (owner !== tripId) {
    setOwner(tripId);
    setCollection(empty);
    setLoaded(false);
    setSelected(null);
    setDocument(null);
    setBusy(false);
    setError(null);
  }
  useEffect(
    () => () => {
      sequence.current++;
      controller.current?.abort();
    },
    [tripId],
  );
  const cancel = useCallback(() => {
    sequence.current++;
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
  }, []);
  function edit(value: TripDocumentSnapshot) {
    cancel();
    setDocument(value);
    setError(null);
  }
  function close() {
    cancel();
    setSelected(null);
    setDocument(null);
    setError(null);
  }
  const request = useCallback(
    async <T>(
      path: string,
      method: string,
      body: unknown,
      apply: (value: T) => void,
    ) => {
      cancel();
      const token = sequence.current;
      const abort = new AbortController();
      controller.current = abort;
      setBusy(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/admin/trip-requests/${encodeURIComponent(tripId)}/document-drafts${path}`,
          {
            method,
            cache: "no-store",
            signal: abort.signal,
            ...(body === undefined
              ? {}
              : {
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                }),
          },
        );
        if (token !== sequence.current) return;
        if (!response.ok) {
          setError(
            response.status === 409
              ? "conflict"
              : response.status === 401 || response.status === 403
                ? "forbidden"
                : response.status === 404
                  ? "not_found"
                  : response.status === 400 ||
                      response.status === 413 ||
                      response.status === 422
                    ? "invalid"
                    : "unavailable",
          );
          return;
        }
        const value = (await response.json()) as T;
        if (token === sequence.current) {
          apply(value);
          return value;
        }
      } catch {
        if (token === sequence.current) setError("unavailable");
      } finally {
        if (token === sequence.current) setBusy(false);
      }
    },
    [cancel, tripId],
  );
  useEffect(() => {
    if (!autoLoad) return;
    let active = true;
    const token = ++sequence.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    void fetch(
      `/api/admin/trip-requests/${encodeURIComponent(tripId)}/document-drafts`,
      {
        cache: "no-store",
        signal: abort.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("collection_unavailable");
        const value = (await response.json()) as Collection;
        if (active && token === sequence.current) {
          setCollection(value);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active && token === sequence.current) setError("unavailable");
      });
    return () => {
      active = false;
      abort.abort();
    };
  }, [autoLoad, tripId]);
  function adopt(value: TripDocumentDraftDto) {
    setSelected(value);
    setDocument(value.document);
    setCollection((previous) => ({
      ...previous,
      drafts: [...previous.drafts.filter((row) => row.id !== value.id), value],
    }));
  }
  function list() {
    return request<Collection>("", "GET", undefined, (value) => {
      setCollection(value);
      setLoaded(true);
    });
  }
  function create(
    template: TripDocumentSnapshot["template"],
    candidateIndex?: number,
  ) {
    return request<TripDocumentDraftDto>(
      "",
      "POST",
      { template, ...(candidateIndex === undefined ? {} : { candidateIndex }) },
      adopt,
    );
  }
  function open(id: string) {
    return request<TripDocumentDraftDto>(
      `/${encodeURIComponent(id)}`,
      "GET",
      undefined,
      adopt,
    );
  }
  function save(value: TripDocumentSnapshot | null = document) {
    if (!selected || !value) return Promise.resolve();
    return request<TripDocumentDraftDto>(
      `/${encodeURIComponent(selected.id)}`,
      "PATCH",
      { revision: selected.revision, document: value },
      adopt,
    );
  }
  function removeSelected() {
    if (!selected) return Promise.resolve();
    const id = selected.id;
    return request<{ deleted: true }>(
      `/${encodeURIComponent(id)}`,
      "DELETE",
      { revision: selected.revision },
      (value) => {
        if (value.deleted !== true) throw new Error("invalid_delete_response");
        setCollection((previous) => ({
          ...previous,
          drafts: previous.drafts.filter((row) => row.id !== id),
        }));
        setSelected(null);
        setDocument(null);
      },
    );
  }
  const dirty =
    selected !== null &&
    JSON.stringify(selected.document) !== JSON.stringify(document);
  return {
    ...collection,
    selected,
    loaded,
    document,
    busy: busy || (autoLoad && !loaded && !error),
    error,
    dirty,
    list,
    create,
    open,
    edit,
    save,
    close,
    removeSelected,
  };
}
