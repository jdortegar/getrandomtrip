import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

// GET /api/experiences - Get all experiences for a tripper
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripperId = searchParams.get("tripperId") || searchParams.get("ownerId");
    const type = searchParams.get("type");
    const level = searchParams.get("level");

    if (!tripperId) {
      return NextResponse.json(
        { error: "tripperId is required" },
        { status: 400 },
      );
    }

    const where: any = {
      isActive: true,
      ownerId: tripperId,
    };

    if (type) where.type = type;
    if (level) where.level = level;

    const experiences = await prisma.package.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            tripperSlug: true,
          },
        },
      },
    });

    return NextResponse.json({ experiences }, { status: 200 });
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/experiences - Create a new experience (tripper only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Only trippers can create experiences" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      type,
      level,
      minNights,
      maxNights,
      minPax,
      maxPax,
      title,
      teaser,
      description,
      heroImage,
      tags,
      highlights,
      destinationCountry,
      destinationCity,
      hotels,
      activities,
      itinerary,
      inclusions,
      exclusions,
      basePriceUsd,
      displayPrice,
      accommodationType,
      transport,
      climate,
      maxTravelTime,
      departPref,
      arrivePref,
      excuseKey,
      isActive,
      isFeatured,
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

    const experienceData = {
      ownerId: user.id,
      type,
      level,
      minNights: minNights || 1,
      maxNights: maxNights || 7,
      minPax: minPax || 1,
      maxPax: maxPax || 8,
      title,
      teaser: teaser || "",
      description: description || "",
      heroImage: heroImage || "",
      tags: tags || [],
      highlights: highlights || [],
      destinationCountry,
      destinationCity,
      hotels: hotels || null,
      activities: activities || null,
      itinerary: itinerary || null,
      inclusions: inclusions || null,
      exclusions: exclusions || null,
      basePriceUsd: basePriceUsd || 0,
      displayPrice: displayPrice || "",
      excuseKey: excuseKey || null,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      accommodationType: accommodationType || "any",
      transport: transport || "any",
      climate: climate || "any",
      maxTravelTime: maxTravelTime || "no-limit",
      departPref: departPref || "any",
      arrivePref: arrivePref || "any",
      status: "DRAFT" as const,
    };

    const newExperience = await prisma.package.create({
      data: experienceData,
    });

    return NextResponse.json({ experience: newExperience }, { status: 201 });
  } catch (error) {
    console.error("Error creating experience:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
