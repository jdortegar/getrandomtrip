/**
 * Maintenance mode, decided in the proxy (`src/proxy.ts`) before any page
 * runs. While the admin "Modo mantenimiento" toggle (`SiteSetting.gateEnabled`)
 * is on, every page request from someone who is not a signed-in admin
 * gets the maintenance HTML with HTTP 503 + Retry-After. The proxy matcher
 * already skips `/api/*`, static files and dotted paths (`/llms.txt`,
 * `/sitemap.xml`), so APIs and webhooks keep working.
 *
 * The proxy has no database access, so the flag and the staff check come
 * from `/api/site-status`. The flag is cached for 30 seconds per instance;
 * the staff check only runs while maintenance is on and a session cookie is
 * present. Any failure fails open: an error never takes the site down.
 */
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/lib/i18n/config";
import { pathWithoutLocale } from "@/lib/i18n/pathForLocale";
import { renderMaintenanceHtml } from "./html";

export const MAINTENANCE_RETRY_AFTER_SECONDS = 600;
const FLAG_TTL_MS = 30_000;

/** The team signs in and finishes account flows here, so these stay open. */
const EXEMPT_ROUTES = [
  "/login",
  "/verify-email",
  "/reset-password",
  "/tripper-invite",
  "/invite",
  "/unsubscribe",
];

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export type SiteStatusFetcher = (
  url: URL,
  cookie?: string,
) => Promise<{ maintenance: boolean; staff: boolean }>;

let cachedFlag: { expires: number; value: boolean } | null = null;

/** Test hook: forget the cached flag. */
export function resetMaintenanceCache(): void {
  cachedFlag = null;
}

const fetchSiteStatus: SiteStatusFetcher = async (url, cookie) => {
  const res = await fetch(url, {
    cache: "no-store",
    headers: cookie ? { cookie } : {},
  });
  if (!res.ok) throw new Error(`site-status responded ${res.status}`);
  return res.json();
};

function isExemptPath(path: string): boolean {
  if (process.env.NODE_ENV === "development" && path === "/sentry-example-page")
    return true;
  return EXEMPT_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some(({ name }) =>
      SESSION_COOKIE_NAMES.some(
        (base) => name === base || name.startsWith(`${base}.`),
      ),
    );
}

function localeOf(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  return hasLocale(first) ? first : DEFAULT_LOCALE;
}

async function isMaintenanceOn(
  url: URL,
  fetcher: SiteStatusFetcher,
  now: number,
): Promise<boolean> {
  if (cachedFlag && cachedFlag.expires > now) return cachedFlag.value;
  const { maintenance } = await fetcher(url);
  cachedFlag = { expires: now + FLAG_TTL_MS, value: maintenance };
  return maintenance;
}

export async function maintenanceResponse(
  req: NextRequest,
  fetcher: SiteStatusFetcher = fetchSiteStatus,
  now: number = Date.now(),
): Promise<NextResponse | null> {
  const { pathname, origin } = req.nextUrl;
  if (isExemptPath(pathWithoutLocale(pathname) || "/")) return null;

  const statusUrl = new URL("/api/site-status", origin);
  try {
    if (!(await isMaintenanceOn(statusUrl, fetcher, now))) return null;
    if (hasSessionCookie(req)) {
      const { staff } = await fetcher(
        statusUrl,
        req.headers.get("cookie") ?? "",
      );
      if (staff) return null;
    }
  } catch {
    return null;
  }

  return new NextResponse(renderMaintenanceHtml(localeOf(pathname)), {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
      "retry-after": String(MAINTENANCE_RETRY_AFTER_SECONDS),
    },
    status: 503,
  });
}
