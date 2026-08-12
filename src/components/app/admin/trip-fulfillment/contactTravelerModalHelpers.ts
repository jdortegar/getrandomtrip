/**
 * Pure logic extracted from `ContactTravelerModal` so it can be unit tested
 * without mocking the modal's rendering, fetch, or dialog primitives.
 * Precedent: `userRoleModalHelpers.ts` + its `__tests__` sibling.
 */

import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";

/**
 * Mirrors `resolveLocale` in `src/lib/email/index.ts` so the client-side
 * prefill is built in the SAME locale the email itself renders in
 * (Resolved Decision #10 — traveler locale, not the admin's dashboard
 * locale).
 */
export function resolveContactLocale(
  locale: string | null | undefined,
): "es" | "en" {
  return locale === "en" ? "en" : "es";
}

/** Interpolates `{{userName}}` into the traveler-locale prefill body template. */
export function buildPrefillBody(template: string, userName: string): string {
  return interpolateTemplate(template, { userName });
}

/**
 * Send is enabled only when both fields carry real (non-whitespace) content
 * and a send isn't already in flight.
 */
export function canSend(
  subject: string,
  body: string,
  sending: boolean,
): boolean {
  return !sending && subject.trim().length > 0 && body.trim().length > 0;
}
