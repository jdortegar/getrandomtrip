import { NextResponse } from "next/server";
import { getActiveTripperSlugsAndNames } from "@/lib/db/tripper-queries";
import { readAttributionSlug } from "@/lib/tripper/attribution-server";

export const dynamic = "force-dynamic";

/**
 * GET -> { trippers: [{slug, name}], current: slug | null }
 *
 * `current` is derived server-side from the httpOnly `grt_tripper` cookie —
 * the register modal (client component) can't read it directly (design
 * "current derived server-side"). Only surfaced when it matches an
 * ACTIVE tripper in the same response — a stale/deactivated cookie slug
 * resolves to `current: null`, matching the register `<select>`'s "None"
 * default rather than pre-selecting a value absent from its own options.
 */
export async function GET() {
  const [trippers, cookieSlug] = await Promise.all([
    getActiveTripperSlugsAndNames(),
    readAttributionSlug(),
  ]);

  const list = trippers.map((tripper) => ({
    slug: tripper.tripperSlug,
    name: tripper.name,
  }));

  const current =
    cookieSlug && list.some((tripper) => tripper.slug === cookieSlug)
      ? cookieSlug
      : null;

  return NextResponse.json({ trippers: list, current });
}
