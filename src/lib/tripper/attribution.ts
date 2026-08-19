/**
 * Edge-safe tripper attribution primitives (design ADR-2/ADR-3/ADR-4/ADR-5).
 *
 * This module MUST stay importable from `src/proxy.ts` (Next.js Edge
 * runtime). It MUST NEVER import `node:crypto`, `@/lib/prisma`, or any
 * `next-auth`/`next/headers` server bits — only Web Crypto (`crypto.subtle`),
 * which is available in both Edge and Node. See
 * `src/lib/tripper/__tests__/attribution.purity.test.ts` for the regression
 * guard, and `src/lib/tripper/attribution-server.ts` (Node-only) for anything
 * that needs Prisma or `next/headers`.
 *
 * The signed cookie payload is a pointer, never an authority — every
 * price/referral-affecting read MUST re-validate liveness at read time via
 * `getTripperJourneyContext` (see `attribution-server.ts`), never trust this
 * value indefinitely.
 */

/** Cookie name — `grt_*` namespace, matching `grt_tripper_invite` / `grt_traveler_invite` (ADR-2). */
export const GRT_TRIPPER_COOKIE = "grt_tripper";

/** Cookie TTL: 30 days, in seconds (ADR-4 — product-confirmed referral window). */
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/** Domain-separation label for the derived HMAC signing key (ADR-3). `v1` gives free key rotation. */
const KEY_DERIVATION_LABEL = "grt_tripper.v1";

/** Payload version tag, embedded in the signed cookie value. */
const PAYLOAD_VERSION = "v1";

export function attributionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

/** Reads the `ATTRIBUTION_ENABLED` feature flag. Off = never write/trust the cookie (base RandomTrip catalog only, never a wrong price). */
export function isAttributionEnabled(): boolean {
  return process.env.ATTRIBUTION_ENABLED === "true";
}

// ─────────────────────────────────────────────────────────────────────────
// Signing (Web Crypto HMAC-SHA256 only — no node:crypto)
// ─────────────────────────────────────────────────────────────────────────

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function importHmacKey(rawKey: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Derives the attribution signing key from `NEXTAUTH_SECRET` via a labeled
 * HMAC (ADR-3): `key = HMAC-SHA256(NEXTAUTH_SECRET, "grt_tripper.v1")`. Never
 * signs with the raw NextAuth secret directly — cryptographic domain
 * separation so an attribution-cookie oracle can never become a session-JWT
 * oracle.
 *
 * Cached per secret value: `NEXTAUTH_SECRET` is constant for the process
 * lifetime, and this runs on every `signAttribution`/`verifyAttribution` call
 * on the Edge request path — re-deriving it each time would spend two
 * `crypto.subtle` round trips per request for no reason.
 */
const derivedKeyCache = new Map<string, Promise<CryptoKey>>();

async function deriveAttributionKey(secret: string): Promise<CryptoKey> {
  let cached = derivedKeyCache.get(secret);
  if (!cached) {
    cached = (async () => {
      const encoder = new TextEncoder();
      const macKey = await importHmacKey(encoder.encode(secret));
      const derivedBytes = await crypto.subtle.sign(
        "HMAC",
        macKey,
        encoder.encode(KEY_DERIVATION_LABEL),
      );
      return importHmacKey(derivedBytes);
    })();
    derivedKeyCache.set(secret, cached);
  }
  return cached;
}

/** Constant-time-ish string comparison for signature checks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Signs `slug` into a self-contained token: `v1.<slug>.<expEpochSec>.<sig>`.
 * Embedding `exp` in the signed payload makes TTL a server-enforced
 * invariant, not a browser courtesy (a forged/extended `Max-Age` still fails
 * verification once `exp` has passed).
 */
export async function signAttribution(
  slug: string,
  secret: string,
  ttlSec: number,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${PAYLOAD_VERSION}.${slug}.${exp}`;
  const key = await deriveAttributionKey(secret);
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${toBase64Url(sigBuffer)}`;
}

/**
 * Verifies a signed attribution token, returning the slug only if the
 * signature is valid AND `exp` has not passed. Any structural, signature, or
 * expiry failure returns `null` — callers treat that identically to "no
 * cookie" (clear).
 *
 * Parses `version` from the front and `exp`/`sig` from the back rather than
 * splitting on every `.` — nothing guarantees a tripper slug is dot-free
 * (`/api/user/tripper` only checks uniqueness, not character set), so a slug
 * like `j.doe` must not shift the fixed-position fields.
 */
export async function verifyAttribution(
  raw: string | undefined,
  secret: string,
): Promise<string | null> {
  if (!raw) return null;

  const firstDot = raw.indexOf(".");
  if (firstDot === -1) return null;
  const version = raw.slice(0, firstDot);
  if (version !== PAYLOAD_VERSION) return null;

  const rest = raw.slice(firstDot + 1);
  const lastDot = rest.lastIndexOf(".");
  if (lastDot === -1) return null;
  const sig = rest.slice(lastDot + 1);

  const beforeSig = rest.slice(0, lastDot);
  const secondLastDot = beforeSig.lastIndexOf(".");
  if (secondLastDot === -1) return null;
  const expStr = beforeSig.slice(secondLastDot + 1);
  const slug = beforeSig.slice(0, secondLastDot);

  if (!slug || !expStr || !sig) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp)) return null;
  if (exp < Math.floor(Date.now() / 1000)) return null;

  const payload = `${version}.${slug}.${expStr}`;
  const key = await deriveAttributionKey(secret);
  const expectedSigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expectedSig = toBase64Url(expectedSigBuffer);

  if (!safeEqual(expectedSig, sig)) return null;

  return slug;
}

// ─────────────────────────────────────────────────────────────────────────
// Pure precedence resolver (design "Data Flow" section — table-testable)
// ─────────────────────────────────────────────────────────────────────────

/** The NextAuth JWT's `referredByTripperSlug` claim value (ADR-5). */
export type AttributionClaim = string | null | undefined;

export type AttributionAction =
  | { kind: "keep" }
  | { kind: "set"; slug: string }
  | { kind: "clear" };

/**
 * Pure decision function — no I/O. Precedence (highest to lowest):
 * 1. `claimSlug` is a string -> force-set (frozen referral beats today's link).
 * 2. `claimSlug` is explicit `null` -> clear (signed-in user with no referrer).
 * 3. `claimSlug` is `undefined` (anonymous or pre-deploy token):
 *    a. `paramSlug` present -> set to param.
 *    b. otherwise, `cookieSlug` valid (already HMAC-verified by the caller,
 *       else `null`) -> keep (caller refreshes `exp`).
 *    c. otherwise -> clear.
 */
export function resolveAttribution(input: {
  claimSlug: AttributionClaim;
  paramSlug: string | null;
  cookieSlug: string | null;
}): AttributionAction {
  const { claimSlug, paramSlug, cookieSlug } = input;

  if (typeof claimSlug === "string") {
    return { kind: "set", slug: claimSlug };
  }

  if (claimSlug === null) {
    return { kind: "clear" };
  }

  if (paramSlug) {
    return { kind: "set", slug: paramSlug };
  }

  if (cookieSlug) {
    return { kind: "keep" };
  }

  return { kind: "clear" };
}
