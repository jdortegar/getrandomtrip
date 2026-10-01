import { parseNonproductionOrigin } from "../../config/deployment.cjs";

/** Edge-safe runtime policy. NODE_ENV describes the build, not the deploy. */
export function isProductionDeployment(): boolean {
  return process.env.RT_DEPLOY_ENV === "production";
}

export function getBlobStoreName(name: string): string {
  // Develop and previews intentionally share one database and one media scope.
  return isProductionDeployment() ? name : `nonproduction-${name}`;
}

export function getAuthSecret(): string {
  return isProductionDeployment()
    ? (process.env.NEXTAUTH_SECRET ?? "")
    : (process.env.RT_NONPRODUCTION_AUTH_SECRET ?? "");
}

/** The build supplies this public value; never infer identity from request Host. */
export function getNonproductionOrigin(): string | null {
  return parseNonproductionOrigin(
    process.env.NEXT_PUBLIC_RT_PUBLIC_ORIGIN,
    process.env.NEXT_PUBLIC_RT_SITE_NAME,
  );
}

/**
 * Tripper discovery UI is hidden in production until there are enough
 * trippers. Fails closed: only an explicit nonproduction build shows it.
 */
export function showTripperDiscovery(): boolean {
  return process.env.NEXT_PUBLIC_RT_DEPLOY_ENV === "nonproduction";
}
