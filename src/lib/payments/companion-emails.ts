const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalized companion emails for an INDIVIDUAL checkout, or null when they
 * don't fill every adult companion slot with distinct, well-formed addresses
 * other than the buyer's. Shared by the checkout form and the quote route.
 */
export function parseCompanionEmails(
  raw: unknown,
  slots: number,
  buyerEmail: string | null | undefined,
): string[] | null {
  if (!Array.isArray(raw) || raw.length !== slots) return null;
  const emails = raw.map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""));
  const buyer = buyerEmail?.trim().toLowerCase();
  if (emails.some((e) => !EMAIL_RE.test(e) || e === buyer)) return null;
  return new Set(emails).size === emails.length ? emails : null;
}
