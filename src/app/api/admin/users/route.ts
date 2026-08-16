import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getAccessInviteStatuses } from "@/lib/auth/accessInviteTokens";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );
    const searchParam = searchParams.get("search");
    const where = searchParam
      ? { name: { contains: searchParam, mode: "insensitive" as const } }
      : undefined;

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          avatarUrl: true,
          commission: true,
          createdAt: true,
          email: true,
          id: true,
          name: true,
          roles: true,
          tripperSlug: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const inviteStatuses = await getAccessInviteStatuses(
      rows.map((u) => u.email),
    );
    const users = rows.map((u) => ({
      ...u,
      inviteStatus: inviteStatuses.get(u.email) ?? null,
    }));

    return NextResponse.json({ users, total, page, limit });
  } catch (error) {
    console.error("[admin/users] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
