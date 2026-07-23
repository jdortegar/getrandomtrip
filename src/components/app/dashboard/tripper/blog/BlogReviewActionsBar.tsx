"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface BlogReviewActionsBarProps {
  changedFields: string[];
  changedFieldsLabel: string;
  actionsSlot: ReactNode;
  /** Extra content stacked below the changed-fields summary (e.g. a note from the other party). */
  leftSlot?: ReactNode;
}

/**
 * Sticky top bar for the admin blog review screen and the tripper
 * review-copy screen — combines the changed-fields summary with the
 * approve/reject/edit actions so both stay reachable from any tab/scroll
 * position, instead of requiring a click through every tab to reach the
 * actions at the bottom of the form. Mirrors `ReviewActionsBar`
 * (experiences) — kept as a separate, parallel component per the
 * tripper-blog-review proposal's "parallel implementation, not a shared
 * layer" decision.
 */
export function BlogReviewActionsBar({
  changedFields,
  changedFieldsLabel,
  actionsSlot,
  leftSlot,
}: BlogReviewActionsBarProps) {
  return (
    // Site `Navbar` is `sticky top-0 z-50 h-16` — offset below it (same
    // `--rt-header-h` var the tripper topbar uses) so the two don't compete
    // for the same viewport row; without this, the navbar's higher z-index
    // covers this bar's top edge, leaving only its bottom border visible.
    <div
      className="sticky z-30 w-full border-b border-amber-200 bg-amber-50"
      style={{ top: "var(--rt-header-h, 64px)" }}
    >
      <div className="rt-container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {changedFields.length > 0 && (
            <div className="flex items-start gap-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <span className="font-semibold">{changedFieldsLabel}</span>{" "}
                <span>{changedFields.join(", ")}</span>
              </div>
            </div>
          )}
          {leftSlot}
        </div>
        <div className="shrink-0">{actionsSlot}</div>
      </div>
    </div>
  );
}
