import type { MarketingDictionary } from "@/lib/types/dictionary";

type RegisterErrorAuthCopy = Pick<
  MarketingDictionary["auth"],
  "fillAllFields" | "invalidEmail" | "passwordPolicyHint" | "emailTaken"
>;

/**
 * Maps the stable error codes returned by POST /api/auth/register to
 * localized copy. Returns undefined for unrecognized codes (e.g.
 * INTERNAL_ERROR) so each caller falls back to its own generic message.
 */
export function registerErrorMessage(
  code: unknown,
  auth: RegisterErrorAuthCopy | undefined,
): string | undefined {
  switch (code) {
    case "MISSING_FIELDS":
      return auth?.fillAllFields;
    case "INVALID_EMAIL":
      return auth?.invalidEmail;
    case "WEAK_PASSWORD":
      return auth?.passwordPolicyHint;
    case "USER_EXISTS":
      return auth?.emailTaken;
    default:
      return undefined;
  }
}
