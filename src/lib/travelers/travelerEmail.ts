/** Trim + lowercase; nullish input becomes an empty string. */
export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Case-insensitive, trim-tolerant comparison. Empty values never match. */
export function emailsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeEmail(a);
  return left !== "" && left === normalizeEmail(b);
}

/** `jane.doe@gmail.com` -> `j***@gmail.com`; null when there is no usable address. */
export function maskEmail(value: string | null | undefined): string | null {
  const email = (value ?? "").trim();
  const at = email.indexOf("@");
  if (at < 1) return null;
  return `${email[0]}***${email.slice(at)}`;
}
