"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";

export function useXsedRoadmapPreview(
  tripId: string,
  document: XsedRoadmapDocument,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<
    | "forbidden"
    | "trip_not_found"
    | "too_large"
    | "invalid"
    | "unavailable"
    | null
  >(null);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const activeUrl = useRef<string | null>(null);
  const dispose = useCallback(() => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    if (activeUrl.current) URL.revokeObjectURL(activeUrl.current);
    activeUrl.current = null;
  }, []);
  const reset = useCallback(() => {
    dispose();
    setUrl(null);
    setBusy(false);
    setError(null);
  }, [dispose]);
  const [owner, setOwner] = useState({ tripId, document });
  if (owner.tripId !== tripId || owner.document !== document) {
    setOwner({ tripId, document });
    setUrl(null);
    setBusy(false);
    setError(null);
  }
  useEffect(() => dispose, [tripId, document, dispose]);

  async function preview() {
    reset();
    const token = generation.current;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/trip-requests/${encodeURIComponent(tripId)}/xsed-roadmap-preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(document),
          cache: "no-store",
          signal: abort.signal,
        },
      );
      if (token !== generation.current) return;
      if (!response.ok) {
        setError(
          response.status === 401 || response.status === 403
            ? "forbidden"
            : response.status === 404
              ? "trip_not_found"
              : response.status === 413
                ? "too_large"
                : response.status === 400 || response.status === 422
                  ? "invalid"
                  : "unavailable",
        );
        return;
      }
      if (
        response.headers.get("Content-Type")?.split(";")[0].trim() !==
        "application/pdf"
      ) {
        setError("unavailable");
        return;
      }
      const blob = await response.blob();
      if (token !== generation.current) return;
      if (blob.size > 4 * 1024 * 1024) {
        setError("too_large");
        return;
      }
      activeUrl.current = URL.createObjectURL(blob);
      setUrl(activeUrl.current);
    } catch {
      if (token === generation.current) setError("unavailable");
    } finally {
      if (token === generation.current) setBusy(false);
    }
  }
  return { url, busy, error, preview, reset };
}
