import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body?.isActive !== "boolean") {
      return NextResponse.json(
        { error: "Body must be { isActive: boolean }" },
        { status: 400 },
      );
    }

    const caller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tripperSlug: true },
    });

    if (!caller) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!caller.tripperSlug) {
      return NextResponse.json(
        { error: "Complete your profile URL setup before toggling visibility." },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { isActive: body.isActive },
      select: { isActive: true, tripperSlug: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[tripper/status] PATCH", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
