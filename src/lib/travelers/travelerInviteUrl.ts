import { getNonproductionOrigin, isProductionDeployment } from "@/lib/deployment";

export const PRODUCTION_ORIGIN = "https://getrandomtrip.com";

/**
 * Origin used in companion invite/reminder links: production stays on the
 * canonical site; nonproduction deploys link to their own origin so QA lands
 * on the same environment that issued the token. The production fallback
 * applies ONLY when a nonproduction deploy has no valid public origin (the
 * build normally guarantees one) — it is deliberate, never an accident.
 */
export function getInviteOrigin(): string {
  if (isProductionDeployment()) return PRODUCTION_ORIGIN;
  return getNonproductionOrigin() ?? PRODUCTION_ORIGIN;
}

export function buildTravelerInviteUrl(
  locale: "es" | "en",
  plaintextToken: string,
): string {
  return `${getInviteOrigin()}/${locale}/invite/${plaintextToken}`;
}
