export type BlogShellMode = "tripper" | "adminCreate" | "adminEdit" | "adminReadOnly";

/**
 * Where to redirect after a successful publish/save — mirrors
 * NewExperienceShell's resolvePublishRedirectPath. An admin creating or
 * editing a RANDOMTRIP post lands back on the admin blog list, not the
 * tripper's own "My Blog" page.
 */
export function resolveBlogPublishRedirectPath(
  mode: BlogShellMode,
  locale: string,
): string {
  return mode === "adminCreate"
    ? `/${locale}/dashboard/admin/blog`
    : `/${locale}/dashboard/tripper/blog`;
}

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
 * own edit page, or an admin's RANDOMTRIP edit page) rather than the "new"
 * post flow — autosave is for creation only; an edit page disables it
 * entirely, regardless of status, and relies on an explicit "Finish"/"Save
 * Changes" click. `adminEdit` (review-copy editing) is a different, nested
 * flow and keeps its own always-on autosave.
 */
export function isEditingExisting(
  mode: BlogShellMode,
  hasInitialDraftId: boolean,
): boolean {
  return hasInitialDraftId && (mode === "tripper" || mode === "adminCreate");
}

export interface FinalizeCopy {
  submitLabel: string;
  confirmTitle: string;
  confirmBody: string;
}

export interface FinalizeCopyDict {
  submitConfirmTitle: string;
  submitConfirmBody: string;
  actionBar: { submitForReview: string };
}

/**
 * Resolves the finalize CTA label + confirm-modal copy. Falls back to the
 * tripper dictionary defaults when no `finalizeCopy` override is passed —
 * tripper mode must see identical copy to before this change. Mirrors
 * NewExperienceShell's resolveFinalizeCopy exactly.
 */
export function resolveFinalizeCopy(
  dict: FinalizeCopyDict,
  finalizeCopy?: FinalizeCopy,
): FinalizeCopy {
  return {
    submitLabel: finalizeCopy?.submitLabel ?? dict.actionBar.submitForReview,
    confirmTitle: finalizeCopy?.confirmTitle ?? dict.submitConfirmTitle,
    confirmBody: finalizeCopy?.confirmBody ?? dict.submitConfirmBody,
  };
}

/**
 * The tripper-note textarea (submit confirm modal) only makes sense when a
 * tripper is addressing an admin reviewer — admin-created (RANDOMTRIP) posts
 * have no reviewer to note, so it is hidden for `adminCreate` only.
 */
export function shouldShowTripperNoteField(mode: BlogShellMode): boolean {
  return mode !== "adminCreate";
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
