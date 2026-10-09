/** Max characters before search engines start truncating a meta description. */
export const META_DESCRIPTION_MAX = 155;

const ELLIPSIS = "…";

/**
 * Normalizes free text (e.g. a tripper bio) into a meta description:
 * collapses whitespace and cuts at a word boundary within the length limit.
 */
export function toMetaDescription(
  text: string | null | undefined,
  max: number = META_DESCRIPTION_MAX,
): string {
  const normalized = (text ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;

  const slice = normalized.slice(0, max - ELLIPSIS.length);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s.,;:!?-]+$/, "")}${ELLIPSIS}`;
}
