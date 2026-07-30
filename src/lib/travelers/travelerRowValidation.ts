import type { TravelerStatus } from "@/types/traveler";

/**
 * Client-side pre-check for a minor row's direct-save action. Mirrors the
 * server-side rule in `PATCH /api/travelers/[id]` (all three fields required
 * in the same request) so the UI can show the inline "fill in all fields"
 * error without a round-trip when the row is obviously incomplete.
 */
export function isMinorRowFilled(fields: {
  fullName: string;
  dateOfBirth: string;
  idDocument: string;
}): boolean {
  return (
    fields.fullName.trim() !== "" &&
    fields.dateOfBirth.trim() !== "" &&
    fields.idDocument.trim() !== ""
  );
}

/**
 * The adult row's ID/passport field is disabled while `INVITED` — the
 * companion is expected to supply it themselves via the invite link, and a
 * resend would overwrite any value the buyer typed in the meantime. It is
 * editable while `PENDING` (buyer fills the whole row directly, no invite
 * sent) and editable again once `COMPLETE` (pre-cutoff edits remain allowed
 * per spec, e.g. fixing a typo).
 */
export function isAdultIdDocumentEditable(status: TravelerStatus): boolean {
  return status !== "INVITED";
}
