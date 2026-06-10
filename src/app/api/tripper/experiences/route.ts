// ============================================================================
// GET  /api/tripper/experiences - List tripper's own experiences
// POST /api/tripper/experiences - Create a new experience (DRAFT)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getTripperExperiences } from "@/lib/db/tripper-queries";
import { prisma } from "@/lib/prisma";
import type { ExperienceFormDraft } from "@/types/tripper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    const experiences = await getTripperExperiences(user.id);

    return NextResponse.json({ experiences });
  } catch (error) {
    console.error("Error fetching tripper experiences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });
    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as ExperienceFormDraft;

    const experience = await prisma.experience.create({
      data: {
        ownerId: user.id,
        createdById: user.id,
        status: "DRAFT",
        type: Array.isArray(body.type) ? body.type : [body.type].filter(Boolean),
        level: body.level || null,
        excuseKey: Array.isArray(body.excuseKey) ? body.excuseKey : [],
        minNights: body.minNights,
        maxNights: body.maxNights,
        minPax: body.minPax,
        maxPax: body.maxPax,
        title: body.title,
        teaser: body.teaser,
        description: body.description,
        heroImage: body.heroImage || "",
        galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages : [],
        tags: body.tags,
        highlights: body.highlights,
        destinationCountry: body.destinationCountry,
        destinationCity: body.destinationCity,
        hotels: body.accommodations as unknown as object[],
        activities: body.activities as unknown as object[],
        itinerary: body.itinerary as unknown as object[],
        inclusions: body.inclusions as unknown as object[],
        exclusions: body.exclusions as unknown as object[],
        accommodationType: body.accommodationType,
        transport: body.transport,
        climate: body.climate,
        maxTravelTime: body.maxTravelTime,
        departPref: body.departPref,
        arrivePref: body.arrivePref,
        season: Array.isArray(body.season) ? body.season : [],
      },
      select: { id: true },
    });

    return NextResponse.json({ id: experience.id }, { status: 201 });
  } catch (error) {
    console.error("[tripper/experiences] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
