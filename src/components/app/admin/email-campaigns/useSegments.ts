"use client";

import { useCallback, useEffect, useState } from "react";
import type { SegmentSummary, SegmentsLoadStatus } from "@/types/emailCampaign";
import { SEGMENTS_API } from "./segmentApi";

/**
 * Loads the admin segments list (system segments first, then by name).
 * `reload` refetches it, e.g. after a create, rename or delete.
 */
export function useSegments() {
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [status, setStatus] = useState<SegmentsLoadStatus>("loading");
  const [request, setRequest] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(SEGMENTS_API)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          segments?: SegmentSummary[];
        } | null;
        if (!active) return;
        if (res.ok && data?.segments) {
          setSegments(data.segments);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [request]);

  const reload = useCallback(() => {
    setStatus("loading");
    setRequest((n) => n + 1);
  }, []);

  return { reload, segments, status };
}
