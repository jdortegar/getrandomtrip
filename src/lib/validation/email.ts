// Same shape AuthModal already uses for client-side email validation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && EMAIL_RE.test(email);
}
