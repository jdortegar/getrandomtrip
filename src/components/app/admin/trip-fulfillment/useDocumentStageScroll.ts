"use client";
import { useEffect, useRef } from "react";
/** Each workflow stage starts at its heading, not the previous form's scroll offset. */
export function useDocumentStageScroll(stage: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [stage]);
  return ref;
}
