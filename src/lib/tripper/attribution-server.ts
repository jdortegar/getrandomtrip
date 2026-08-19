/**
 * Node-only tripper attribution primitives (design "Two-file module split").
 *
 * Companion to `src/lib/tripper/attribution.ts` (Edge-safe). This file is
 * free to import Prisma and `next/headers` because it is NEVER imported from
 * `src/proxy.ts` (Edge runtime) — only from Node read sites (server
 * components, route handlers, `signIn`'s Google-create branch).
 *
 * The cookie/JWT value is a pointer, never an authority — every
 * price/referral-affecting read goes through `getTripperJourneyContext` here
 * to re-validate liveness (spec "Read-Time Liveness Re-Validation").
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  GRT_TRIPPER_COOKIE,
  getAttributionSecret,
  verifyAttribution,
} from "@/lib/tripper/attribution";
import {
  getTripperJourneyContext,
  type TripperJourneyContext,
} from "@/lib/db/tripper-queries";

/**
 * Reads and verifies the `grt_tripper` cookie server-side (Node read sites
 * only — Server Components, Route Handlers). Returns `null` on any missing,
 * malformed, tampered, or expired cookie — identical treatment to "no
 * cookie" per `verifyAttribution`'s contract.
 */
export async function readAttributionSlug(): Promise<string | null> {
  const raw = (await cookies()).get(GRT_TRIPPER_COOKIE)?.value;
  return verifyAttribution(raw, getAttributionSecret());
}

/**
 * Re-validates a slug's liveness via `getTripperJourneyContext` and returns
 * the branding/pricing context only when the tripper is still `ok`
 * (active + found). `not_found`/`inactive` collapse to `null` — the caller
 * falls back to the base RandomTrip catalog, never a stale price.
 */
export async function resolveLiveAttribution(
  slug: string | null,
): Promise<TripperJourneyContext | null> {
  if (!slug) return null;
  const result = await getTripperJourneyContext(slug);
  return result.status === "ok" ? result.context : null;
}

/**
 * Resolves a tripper slug to its `User.id`, ONLY if that tripper is still
 * ACTIVE and holds the TRIPPER role — used at registration to validate the
 * selected referrer before writing `referredByTripperId`.
 */
export async function resolveReferrerId(
  slug: string | null | undefined,
): Promise<string | null> {
  if (!slug) return null;

  const tripper = await prisma.user.findUnique({
    where: { tripperSlug: slug, roles: { has: "TRIPPER" } },
    select: { id: true, isActive: true },
  });

  if (!tripper || !tripper.isActive) return null;
  return tripper.id;
}

/**
 * Write-once, self-referral-safe stamp of `referredByTripperId` (mirrors
 * `stampSiteAccess`, `src/lib/auth/accessInviteTokens.ts:139-144`).
 * `updateMany`, not `update` — `update`'s `where` only accepts unique
 * fields, so the `referredByTripperId: null` write-once guard is illegal
 * there.
 */
export async function stampReferral(
  userId: string,
  referrerId: string | null,
): Promise<void> {
  if (!referrerId || referrerId === userId) return;

  await prisma.user.updateMany({
    where: { id: userId, referredByTripperId: null },
    data: { referredByTripperId: referrerId },
  });
}
