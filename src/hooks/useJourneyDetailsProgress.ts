"use client";

import { useEffect, useRef } from "react";

export interface JourneyDetailsProgress {
  origin: boolean;
  dates: boolean;
  transport: boolean;
  /** Whether the "details" tab itself is complete (origin + dates only — matches isStepComplete/isTabComplete's existing "details" criteria, which does not require transport). */
  complete: boolean;
}

/**
 * Reports the live, draft-aware completion state of the journey "details"
 * tab (Origin/Dates/Transport substeps + the tab itself) to a callback,
 * re-firing only when one of the boolean values actually changes.
 *
 * Why this exists: JourneyProgressSidebar renders as a *sibling* of
 * JourneyMainContent (see src/app/[locale]/journey/page.tsx), not a parent/
 * child, so it can't read JourneyMainContent's component-local state
 * directly. The sidebar's own isTabComplete/isSubstepComplete read raw URL
 * search params, which lag behind Origin/Dates/Transport edits until the
 * user leaves the "details" tab and useJourneyDraftDetails flushes the
 * draft to the URL. This hook lets JourneyMainContent push the live truth
 * (computed from useJourneyDraftDetails' "effective" values) up to the
 * page, which then overrides the sidebar via its completedTabIds/
 * completedSubstepIds override props for exactly the "details" tab.
 *
 * `onChange` is read through a ref (not a dependency) so a new function
 * identity on every parent render — e.g. an inline arrow passed as a prop —
 * never re-fires the effect on its own; only a real change in one of the
 * progress booleans does.
 */
export function useJourneyDetailsProgressCallback(
  progress: JourneyDetailsProgress,
  onChange: ((progress: JourneyDetailsProgress) => void) | undefined,
): void {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const { origin, dates, transport, complete } = progress;
  useEffect(() => {
    onChangeRef.current?.({ origin, dates, transport, complete });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, dates, transport, complete]);
}
