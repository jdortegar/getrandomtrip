import { pathWithoutLocale } from "@/lib/i18n/pathForLocale";

function pathMatchesSecurePrefix(barePath: string, prefix: string): boolean {
  if (prefix.endsWith("/")) {
    return barePath.startsWith(prefix);
  }
  return barePath === prefix || barePath.startsWith(`${prefix}/`);
}

/**
 * Paths that require authentication; closing the global auth modal while still
 * a guest should send the user home (not leave them on a blank secure shell).
 */
const SECURE_PATH_PREFIXES = [
  "/checkout",
  "/dashboard",
  "/profile",
  "/reveal-destination",
  "/tripper",
  "/trips/",
] as const;

/**
 * @param pathname - Full pathname including optional locale prefix (e.g. `/en/dashboard`).
 */
export function shouldRedirectHomeWhenLeavingAuthModal(pathname: string): boolean {
  const bare =
    pathWithoutLocale(pathname).split("?")[0]?.trim() || "/";
  return SECURE_PATH_PREFIXES.some((prefix) =>
    pathMatchesSecurePrefix(bare, prefix),
  );
}
