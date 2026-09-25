"use client";
import { useEffect, useState } from "react";
import type {
  TripDocumentSourceContext,
  TripDocumentSourceSelection,
} from "@/lib/types/TripDocumentSource";

/** Source reads are independent of persistent draft saves and editor state. */
export function useTripDocumentSource(
  tripId: string,
  experienceId?: string | null,
  enabled = true,
): TripDocumentSourceSelection {
  const key = JSON.stringify([
    tripId,
    experienceId === undefined ? "saved" : [experienceId],
  ]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    key: string;
    context: TripDocumentSourceContext | null;
    status: TripDocumentSourceSelection["status"];
  }>({ key, context: null, status: "loading" });
  if (state.key !== key) setState({ key, context: null, status: "loading" });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const controller = new AbortController();
    const query =
      experienceId === undefined
        ? ""
        : `?${new URLSearchParams({ experienceId: experienceId ?? "" })}`;
    void fetch(
      `/api/admin/trip-requests/${encodeURIComponent(tripId)}/document-source${query}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("source_unavailable");
        const context = (await response.json()) as TripDocumentSourceContext;
        if (active) setState({ key, context, status: "ready" });
      })
      .catch(() => {
        if (active) setState({ key, context: null, status: "error" });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, enabled, experienceId, key, tripId]);

  return {
    key: `${key}:${attempt}`,
    experienceId,
    context: state.key === key ? state.context : null,
    status: state.key === key ? state.status : "loading",
    retry: () => {
      setState({ key, context: null, status: "loading" });
      setAttempt((value) => value + 1);
    },
  };
}
