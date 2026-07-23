export type BlogShellMode = "tripper" | "adminEdit" | "adminReadOnly";

/**
 * True only in `adminReadOnly` — the tripper reviewing an admin's proposed
 * copy, or an admin viewing a not-yet-locked original, must never trigger
 * the debounced autosave loop.
 */
export function shouldSkipAutosave(mode: BlogShellMode): boolean {
  return mode === "adminReadOnly";
}

/**
 * True whenever the shell was opened against an existing post (tripper's
 * own edit page) rather than the "new" post flow — autosave is for creation
 * only; an edit page disables it entirely, regardless of status, and relies
 * on an explicit "Finish" click. `adminEdit` (review-copy editing) is a
 * different, nested flow and keeps its own always-on autosave.
 */
export function isEditingExisting(
  mode: BlogShellMode,
  hasInitialDraftId: boolean,
): boolean {
  return hasInitialDraftId && mode === "tripper";
}

/**
 * Footer nav (Back/Next/Finish) only makes sense in `tripper` mode, where
 * the tripper is authoring/finishing their own draft. Both admin modes
 * (`adminEdit`, `adminReadOnly`) render `reviewActionsSlot` in its place.
 */
export function shouldSwapFooterForReviewActions(mode: BlogShellMode): boolean {
  return mode !== "tripper";
}

export type BlogPersistTarget =
  | { kind: "adminEditCopy"; copyId: string }
  | { kind: "createDraft" }
  | { kind: "updateDraft"; id: string };

/**
 * Resolves where `persistDraft` should PATCH/POST to. `adminEdit` with a
 * copy id always wins — it targets the dedicated `edit-copy` endpoint,
 * never the tripper's own draft routes. Everything else falls back to the
 * existing tripper create/update branch (unchanged from before the mode
 * system existed).
 */
export function resolveBlogPersistTarget(
  mode: BlogShellMode,
  adminCopyId: string | undefined,
  draftId: string | null,
): BlogPersistTarget {
  if (mode === "adminEdit" && adminCopyId) {
    return { kind: "adminEditCopy", copyId: adminCopyId };
  }
  if (!draftId) return { kind: "createDraft" };
  return { kind: "updateDraft", id: draftId };
}
