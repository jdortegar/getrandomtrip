/** Max length of BlogPost.label (e.g. "XSED Nº1 (AR)"). */
export const BLOG_LABEL_MAX_LENGTH = 40;

/**
 * Normalizes an incoming (untrusted) BlogPost.label value.
 * `undefined` → field not sent (leave untouched); empty/non-string → null.
 */
export function normalizeBlogLabel(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, BLOG_LABEL_MAX_LENGTH) : null;
}
