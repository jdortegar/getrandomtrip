import type { ExperienceShellMode } from "./NewExperienceShell";

/**
 * Post-publish redirect target. Role-aware: adminCreate rows go back to the
 * admin experiences list; every other mode keeps the existing tripper list
 * target (do not widen this for `tripper` — regression risk).
 */
export function resolvePublishRedirectPath(
  mode: ExperienceShellMode,
  locale: string,
): string {
  return mode === "adminCreate"
    ? `/${locale}/dashboard/admin/experiences`
    : `/${locale}/dashboard/tripper/experiences`;
}

/**
 * Guard for `handleRequestSubmit`: only `tripper` and `adminCreate` may
 * trigger the finalize/submit-confirm flow. `adminEdit`/`adminReadOnly` never
 * finalize through this shell.
 *
 * `adminCreate` additionally requires `status === "DRAFT"` — once a RANDOMTRIP
 * row is ACTIVE there is no PENDING_REVIEW step to resubmit into (unlike
 * `tripper` mode, where the submit route's DRAFT-only guard is reached via
 * `revertToDraft` flipping an edited ACTIVE row back to DRAFT first), so the
 * finalize CTA would just 409. `tripper` mode is intentionally left permissive
 * here — its resubmit-after-edit flow depends on it.
 */
export function canRequestSubmit(
  mode: ExperienceShellMode,
  isSubmitting: boolean,
  isReadOnly: boolean,
  status: string,
): boolean {
  if (isSubmitting || isReadOnly) return false;
  if (mode === "adminCreate") return status === "DRAFT";
  return mode === "tripper";
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
 * tripper mode must see identical copy to before this change.
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
 * tripper is addressing an admin reviewer — admin-created (RANDOMTRIP) rows
 * have no reviewer to note, so it is hidden for `adminCreate` only.
 */
export function shouldShowTripperNoteField(mode: ExperienceShellMode): boolean {
  return mode !== "adminCreate";
}

/**
 * True when editing an already-published RANDOMTRIP row (adminCreate mode,
 * status !== DRAFT) — there is no staging/review copy for this flow, so the
 * caller must suppress autosave-to-the-live-row and require an explicit
 * "Save Changes" action instead of the debounced autosave loop used while
 * still creating a DRAFT.
 */
export function isEditingLiveRandomtrip(
  mode: ExperienceShellMode,
  status: string,
): boolean {
  return mode === "adminCreate" && status !== "DRAFT";
}
