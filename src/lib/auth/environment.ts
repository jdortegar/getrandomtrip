import { getNonproductionOrigin, isProductionDeployment } from "../deployment";

/** NextAuth 4 reads these at request time even when its package is externalized. */
export function configureAuthEnvironment(): void {
  if (isProductionDeployment()) return;
  const origin = getNonproductionOrigin() ?? "";
  process.env.NEXTAUTH_URL = origin;
  process.env.NEXTAUTH_URL_INTERNAL = origin;
  // Both flags make NextAuth trust forwarded hosts instead of NEXTAUTH_URL.
  delete process.env.AUTH_TRUST_HOST;
  delete process.env.VERCEL;
}
