import { hasLocale, type Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { type AppRole } from "@/lib/auth/roleAccess";

export type DashboardRole = "admin" | "client" | "tripper";

export function hasStrictRole(
  roles: AppRole[],
  required: DashboardRole,
): boolean {
  if (required === "client") {
    return roles.length > 0;
  }
  return roles.includes(required);
}

export function getDefaultDashboardPath(
  roles: AppRole[],
  locale: string,
): string {
  const resolvedLocale: Locale = hasLocale(locale) ? locale : "es";
  if (roles.includes("admin")) {
    return pathForLocale(resolvedLocale, "/dashboard/admin");
  }
  if (roles.includes("tripper")) {
    return pathForLocale(resolvedLocale, "/dashboard/tripper");
  }
  return pathForLocale(resolvedLocale, "/dashboard/client");
}
