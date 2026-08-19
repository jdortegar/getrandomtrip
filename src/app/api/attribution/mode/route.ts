import { NextResponse } from "next/server";
import {
  COOKIE_MAX_AGE,
  GRT_TRIPPER_COOKIE,
  GRT_TRIPPER_LAST_SEEN_COOKIE,
  LAST_SEEN_COOKIE_MAX_AGE,
  attributionCookieOptions,
  getAttributionSecret,
  lastSeenCookieOptions,
  signAttribution,
} from "@/lib/tripper/attribution";

export const dynamic = "force-dynamic";

type ModeRequestBody = {
  mode?: unknown;
  slug?: unknown;
};

function resolveExpectedOrigin(): string | null {
  const configured = process.env.NEXTAUTH_URL;
  if (!configured) return null;
  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

/**
 * Minimal origin/CSRF guard (finding #5, PR2 review): this route signs and
 * sets the `grt_tripper` cookie for whoever calls it, with no auth check —
 * without an origin check, any third-party page could POST here with
 * `credentials: "include"` (a CORS "simple" request, no preflight) and
 * silently attribute a visitor's eventual signup to an attacker-chosen
 * tripper. No other POST route in this codebase sets a sensitive cookie, so
 * there was no existing pattern to reuse — this is a small, route-local
 * check: falls back to `Referer` when `Origin` is absent (some same-origin
 * requests omit it), and rejects outright when neither is present/resolvable
 * or `NEXTAUTH_URL` isn't configured — a missing signal is never "trusted by
 * default" for a state-changing POST with no other protection.
 */
function isTrustedOrigin(request: Request): boolean {
  const expectedOrigin = resolveExpectedOrigin();
  if (!expectedOrigin) return false;

  const candidate =
    request.headers.get("origin") ?? request.headers.get("referer");
  if (!candidate) return false;

  try {
    return new URL(candidate).origin === expectedOrigin;
  } catch {
    return false;
  }
}

/**
 * POST { mode: "tripper" | "randomtrip", slug?: string } — design ADR-9
 * (`AttributionModeBanner` toggle, Phase 3). Rewrites/clears the
 * `grt_tripper` cookie ONLY — this route MUST NEVER touch
 * `referredByTripperId` (that field is write-once at registration, see
 * `attribution-server.ts#stampReferral`; no Prisma import exists here on
 * purpose).
 *
 * `mode: "randomtrip"` clears the LIVE cookie unconditionally (base catalog)
 * — it deliberately leaves `GRT_TRIPPER_LAST_SEEN_COOKIE` untouched (review
 * finding #4): that longer-lived cookie is what lets the banner still offer
 * "switch back to {name}" on a later request, even after this clears the
 * live pricing cookie entirely.
 * `mode: "tripper"` requires `slug` in the body (the caller already knows
 * it — e.g. the banner keeps the underlying slug client-side even while
 * displaying randomtrip mode) and (re-)signs a fresh cookie for it, refreshing
 * the last-seen cookie's TTL for the same slug too. No liveness
 * re-validation happens here, matching the proxy's "cookie is a pointer,
 * never an authority" contract — liveness is re-checked at Node read sites,
 * not at write time.
 */
export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as ModeRequestBody;
  const { mode, slug } = body;

  if (mode !== "tripper" && mode !== "randomtrip") {
    return NextResponse.json({ error: "INVALID_MODE" }, { status: 400 });
  }

  if (mode === "randomtrip") {
    const response = NextResponse.json({ ok: true, mode });
    response.cookies.delete(GRT_TRIPPER_COOKIE);
    return response;
  }

  if (typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json({ error: "MISSING_SLUG" }, { status: 400 });
  }

  const secret = getAttributionSecret();
  const signed = await signAttribution(slug, secret, COOKIE_MAX_AGE);
  const lastSeenSigned = await signAttribution(
    slug,
    secret,
    LAST_SEEN_COOKIE_MAX_AGE,
  );

  const response = NextResponse.json({ ok: true, mode });
  response.cookies.set(GRT_TRIPPER_COOKIE, signed, attributionCookieOptions());
  response.cookies.set(
    GRT_TRIPPER_LAST_SEEN_COOKIE,
    lastSeenSigned,
    lastSeenCookieOptions(),
  );
  return response;
}
