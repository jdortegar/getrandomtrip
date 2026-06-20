// ============================================================================
// PATCH /api/admin/experiences/[id]/edit-copy
// Saves content edits to a review copy. Admin-only — no ownership check.
// Requires: isReviewCopy === true on the target experience.
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!caller || !hasRoleAccess(caller, "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const copy = await (prisma.experience.findUnique as any)({
      where: { id: params.id },
      select: { id: true, isReviewCopy: true, status: true },
    }) as { id: string; isReviewCopy: boolean; status: string } | null;

    if (!copy) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    if (!copy.isReviewCopy) {
      return NextResponse.json(
        { error: "forbidden", message: "Only review copies can be edited via this endpoint" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      type,
      level,
      title,
      teaser,
      description,
      heroImage,
      tags,
      destinationCountry,
      destinationCity,
      excuseKey,
      minNights,
      maxNights,
      minPax,
      maxPax,
      pricingByType,
      hotels: hotelsField,
      accommodations,
      activities,
      itinerary,
      inclusions,
      exclusions,
      accommodationType,
      transport,
      climate,
      maxTravelTime,
      departPref,
      arrivePref,
      season,
    } = body;

    const hotels = hotelsField ?? accommodations;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.experience.update as any)({
      where: { id: params.id },
      data: {
        ...(type !== undefined && { type: Array.isArray(type) ? type : [type].filter(Boolean) }),
        level: level ?? null,
        ...(title && { title }),
        teaser: teaser ?? "",
        description: description ?? "",
        heroImage: heroImage ?? "",
        tags: tags ?? [],
        ...(destinationCountry && { destinationCountry }),
        ...(destinationCity && { destinationCity }),
        excuseKey: Array.isArray(excuseKey) ? excuseKey : [],
        minNights: minNights ?? 1,
        maxNights: maxNights ?? 7,
        minPax: minPax ?? 1,
        maxPax: maxPax ?? 8,
        ...(pricingByType !== undefined && { pricingByType }),
        ...(hotels !== undefined && { hotels }),
        ...(activities !== undefined && { activities }),
        ...(itinerary !== undefined && { itinerary }),
        ...(inclusions !== undefined && { inclusions }),
        ...(exclusions !== undefined && { exclusions }),
        accommodationType: accommodationType ?? "any",
        transport: transport ?? "any",
        climate: climate ?? "any",
        maxTravelTime: maxTravelTime ?? "no-limit",
        departPref: departPref ?? "any",
        arrivePref: arrivePref ?? "any",
        season: Array.isArray(season) ? season : [],
      },
    });

    return NextResponse.json({ experience: updated });
  } catch (error) {
    console.error("[admin/experiences/edit-copy] PATCH", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
