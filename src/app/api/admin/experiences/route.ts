import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({
      select: { id: true, roles: true },
      where: { id: session.user.id },
    });
    if (!caller || !hasRoleAccess(caller, "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterTripperId = searchParams.get("tripperId");
    const filterLevel = searchParams.get("level");
    const filterType = searchParams.get("type");
    const filterStatus = searchParams.get("status");

    // Build additive AND where clause from optional query params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (filterTripperId) where.ownerId = filterTripperId;
    if (filterLevel) where.level = filterLevel;
    if (filterType) where.type = { has: filterType };
    if (filterStatus) where.status = filterStatus;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const experiences = await (prisma.experience.findMany as any)({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        createdAt: true,
        id: true,
        isActive: true,
        isFeatured: true,
        owner: {
          select: {
            email: true,
            id: true,
            name: true,
          },
        },
        status: true,
        title: true,
        type: true,
        level: true,
        destinationCountry: true,
        destinationCity: true,
        teaser: true,
        description: true,
        heroImage: true,
        minPax: true,
        maxPax: true,
        minNights: true,
        maxNights: true,
        pricingByType: true,
        reviewNote: true,
        tripperNote: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ experiences });
  } catch (error) {
    console.error("[admin/experiences] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
