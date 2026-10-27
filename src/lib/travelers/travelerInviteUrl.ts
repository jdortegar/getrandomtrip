import { getApplicationOrigin } from "@/lib/deployment";

export const PRODUCTION_ORIGIN = "https://getrandomtrip.com";

/** Never route environment-specific invite tokens to a production fallback. */
export function getInviteOrigin(): string {
  return getApplicationOrigin();
}

export function buildTravelerInviteUrl(
  locale: "es" | "en",
  plaintextToken: string,
): string {
  return `${getInviteOrigin()}/${locale}/invite/${plaintextToken}`;
}
