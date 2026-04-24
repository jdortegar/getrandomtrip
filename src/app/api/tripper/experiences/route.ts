// ============================================================================
// GET /api/tripper/experiences - Get all experiences for tripper (routes page)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getTripperPackages } from "@/lib/db/tripper-queries";
import { prisma } from "@/lib/prisma";

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

    const experiences = await getTripperPackages(user.id);

    return NextResponse.json({ experiences });
  } catch (error) {
    console.error("Error fetching tripper experiences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
