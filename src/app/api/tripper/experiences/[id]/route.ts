// ============================================================================
// GET /api/tripper/experiences/[id] - Get a single experience by ID for tripper
// PATCH /api/tripper/experiences/[id] - Update an experience by ID for tripper
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const experienceId = params.id;

    const experienceData = await prisma.package.findFirst({
      where: {
        id: experienceId,
        ownerId: user.id,
      },
      select: {
        id: true,
        title: true,
        teaser: true,
        description: true,
        type: true,
        level: true,
        status: true,
        destinationCountry: true,
        destinationCity: true,
        minNights: true,
        maxNights: true,
        minPax: true,
        maxPax: true,
        basePriceUsd: true,
        displayPrice: true,
        heroImage: true,
        tags: true,
        highlights: true,
        excuseKey: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        hotels: true,
        activities: true,
        itinerary: true,
        inclusions: true,
        exclusions: true,
        accommodationType: true,
        transport: true,
        climate: true,
        maxTravelTime: true,
        departPref: true,
        arrivePref: true,
      },
    });

    if (!experienceData) {
      return NextResponse.json(
        { error: "Experience not found or access denied" },
        { status: 404 },
      );
    }

    return NextResponse.json({ experience: experienceData });
  } catch (error) {
    console.error("Error fetching experience:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const experienceId = params.id;

    const existingExperience = await prisma.package.findFirst({
      where: {
        id: experienceId,
        ownerId: user.id,
      },
    });

    if (!existingExperience) {
      return NextResponse.json(
        { error: "Experience not found or access denied" },
        { status: 404 },
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
      highlights,
      destinationCountry,
      destinationCity,
      excuseKey,
      minNights,
      maxNights,
      minPax,
      maxPax,
      basePriceUsd,
      displayPrice,
      isActive,
      isFeatured,
      status,
      hotels,
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
    } = body;

    if (!type || !level || !title || !destinationCountry || !destinationCity) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: type, level, title, destinationCountry, destinationCity",
        },
        { status: 400 },
      );
    }

    const updatedExperience = await prisma.package.update({
      where: { id: experienceId },
      data: {
        type,
        level,
        title,
        teaser: teaser ?? "",
        description: description ?? "",
        heroImage: heroImage ?? "",
        tags: tags ?? [],
        highlights: highlights ?? [],
        destinationCountry,
        destinationCity,
        excuseKey: excuseKey || null,
        minNights: minNights ?? 1,
        maxNights: maxNights ?? 7,
        minPax: minPax ?? 1,
        maxPax: maxPax ?? 8,
        basePriceUsd: basePriceUsd ?? 0,
        displayPrice: displayPrice ?? "",
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        ...(status && { status }),
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
      },
    });

    return NextResponse.json({ experience: updatedExperience });
  } catch (error) {
    console.error("Error updating experience:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
