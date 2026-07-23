export const PASSWORD_MIN_LENGTH = 8;

// Minimum 8 chars, at least one letter and one number.
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function isValidPassword(pw: string): boolean {
  return typeof pw === "string" && PASSWORD_RE.test(pw);
}
