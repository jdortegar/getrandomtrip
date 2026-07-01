import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
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

    const body = (await request.json()) as { isPublic?: unknown };

    if (typeof body.isPublic !== "boolean") {
      return NextResponse.json(
        { error: "isPublic (boolean) is required" },
        { status: 400 },
      );
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: { id: true, tripperId: true, isApproved: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.tripperId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!review.isApproved) {
      return NextResponse.json(
        { error: "Cannot publish an unapproved review" },
        { status: 403 },
      );
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: { isPublic: body.isPublic },
      select: { id: true, isPublic: true },
    });

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error("[tripper/reviews/[id]] PATCH", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
