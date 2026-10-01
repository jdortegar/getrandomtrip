/**
 * Where the verification link sends a companion who registered from an invite
 * page. Only a same-origin, relative `/{locale}/invite/{token}` path is ever
 * accepted (no scheme, host, query or fragment), so `next` can never become an
 * open redirect. The token inside the path is a credential: never log it.
 */
const INVITE_RETURN_PATH = /^\/(?:es|en)\/invite\/[A-Za-z0-9_-]+$/;

export function safeInviteReturnPath(value: unknown): string | null {
  return typeof value === "string" && INVITE_RETURN_PATH.test(value)
    ? value
    : null;
}

export function inviteReturnPath(locale: "es" | "en", token: string): string {
  return `/${locale}/invite/${token}`;
}
