import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getTripperInviteStatuses } from "@/lib/auth/tripperInviteTokens";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        avatarUrl: true,
        createdAt: true,
        email: true,
        id: true,
        name: true,
        roles: true,
        tripperSlug: true,
      },
    });

    const inviteStatuses = await getTripperInviteStatuses(
      rows.map((u) => u.email),
    );
    const users = rows.map((u) => ({
      ...u,
      inviteStatus: inviteStatuses.get(u.email) ?? null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[admin/users] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
