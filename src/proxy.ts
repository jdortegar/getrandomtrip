import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { handleI18n } from "@/lib/i18n/middleware";
import { pathWithoutLocale } from "@/lib/i18n/pathForLocale";
import { LOCALES } from "@/lib/i18n/config";
import {
  COOKIE_MAX_AGE,
  GRT_TRIPPER_COOKIE,
  attributionCookieOptions,
  getAttributionSecret,
  isAttributionEnabled,
  isValidTripperSlug,
  resolveAttribution,
  signAttribution,
  verifyAttribution,
  type AttributionClaim,
} from "@/lib/tripper/attribution";

// Variantes -> canónico (solo para path sin locale o con locale)
const CANON_MAP: Record<string, string> = {
  families: "family",
  familia: "family",
};

function applyCanonRedirect(req: NextRequest): NextResponse | null {
  const pathname = pathWithoutLocale(req.nextUrl.pathname);
  if (!pathname.startsWith("/experiences/by-type/")) return null;

  const url = req.nextUrl.clone();
  const { search, hash } = url;
  const parts = pathname.split("/").filter(Boolean);
  // pathname can be /experiences/by-type/X or /en/experiences/by-type/X - pathWithoutLocale gives /experiences/by-type/X
  const typeIndex = parts.indexOf("by-type") + 1;
  const type = parts[typeIndex];
  if (!type) return null;

  const target = CANON_MAP[type];
  if (!target || target === type) return null;

  parts[typeIndex] = target;
  const newPath = "/" + parts.join("/");
  // If request had locale prefix, preserve it
  const first = req.nextUrl.pathname.split("/").filter(Boolean)[0];
  const hasLocale = first && LOCALES.includes(first as "es" | "en");
  url.pathname = hasLocale ? `/${first}${newPath}` : newPath;
  url.search = search;
  url.hash = hash;
  return NextResponse.redirect(url, 308);
}

/**
 * Extracts an inbound tripper slug from `?tripper=slug` on any route, or
 * from the `/trippers/[slug]` path (spec "Anonymous Pricing-Session
 * Cookie" — both scenarios set the cookie identically).
 *
 * The query-param form is validated against `isValidTripperSlug()` before
 * being trusted: `?tripper=` is ALSO used, pre-existing and unrelated, by
 * `/blog?tripperId=...&tripper=<display name>` links (see
 * `trippers/[tripper]/page.tsx` and `BlogPostClient.tsx`) to carry a
 * human-readable display name, not a slug. Without this check, clicking one
 * of those blog links would silently overwrite a visitor's real referral
 * cookie with a garbage display-name string. The `/trippers/[slug]` path
 * segment is trusted unconditionally — that route structurally can't
 * collide with the blog-link case.
 */
export function extractParamSlug(req: NextRequest): string | null {
  const queryParam = req.nextUrl.searchParams.get("tripper");
  if (queryParam && isValidTripperSlug(queryParam)) return queryParam;

  const pathname = pathWithoutLocale(req.nextUrl.pathname);
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "trippers" && parts[1]) return parts[1];

  return null;
}

/**
 * Applies the `grt_tripper` cookie decision (design "Layer split") to the
 * outgoing response. Edge-only: `getToken()` for the JWT claim, the inbound
 * param/path slug, and the existing (already-verified) cookie feed the pure
 * `resolveAttribution()` resolver — never a DB call, never a liveness
 * check (that happens at Node read sites via `attribution-server.ts`).
 * Gated under `ATTRIBUTION_ENABLED` — off means this is a complete no-op.
 */
export async function applyAttribution(
  req: NextRequest,
  res: NextResponse,
): Promise<void> {
  if (!isAttributionEnabled()) return;

  const secret = getAttributionSecret();
  const token = await getToken({ req, secret });
  // No `?? undefined` here: optional chaining already yields `undefined`
  // when `token` itself is absent, and preserves an explicit `null` when
  // the token exists with no referrer — `resolveAttribution()` requires
  // that exact `null` (not `undefined`) to clear a signed-in user's stale
  // cookie. Coercing it to `undefined` would silently keep refreshing it.
  const claimSlug = token?.referredByTripperSlug as AttributionClaim;

  const paramSlug = extractParamSlug(req);
  const rawCookie = req.cookies.get(GRT_TRIPPER_COOKIE)?.value;
  const cookieSlug = await verifyAttribution(rawCookie, secret);

  const action = resolveAttribution({ claimSlug, paramSlug, cookieSlug });

  if (action.kind === "clear") {
    res.cookies.delete(GRT_TRIPPER_COOKIE);
    return;
  }

  // "set" -> the newly-resolved slug; "keep" -> re-sign the same cookieSlug
  // to refresh its `exp` (design: "caller refreshes exp").
  const slugToSign = action.kind === "set" ? action.slug : cookieSlug;
  if (!slugToSign) return;

  const signed = await signAttribution(slugToSign, secret, COOKIE_MAX_AGE);
  res.cookies.set(GRT_TRIPPER_COOKIE, signed, attributionCookieOptions());
}

export async function proxy(req: NextRequest) {
  const i18nResponse = handleI18n(req);
  const canonResponse = i18nResponse ? null : applyCanonRedirect(req);
  const res = i18nResponse ?? canonResponse ?? NextResponse.next();

  await applyAttribution(req, res);

  return res;
}

export const config = {
  matcher: ["/((?!_next|api|favicon\\.png|.*\\..*).*)"],
};
