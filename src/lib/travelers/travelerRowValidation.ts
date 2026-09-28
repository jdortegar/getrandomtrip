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
