/**
 * Formats a reviewer's real name for public display as "First L." (privacy —
 * never show a traveler's full name on public testimonials), falling back to
 * "Viajero anónimo" when there's no name to work with.
 */
export function formatReviewerAuthor(fullName: string | null | undefined): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Viajero anónimo";
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = last.charAt(0).toUpperCase();
  return `${first} ${initial}.`;
}
