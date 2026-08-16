import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getAccessInviteStatuses } from "@/lib/auth/accessInviteTokens";
import { findExistingUserEmails } from "@/lib/admin/waitlistMembership";
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

    const [rows, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          createdAt: true,
          email: true,
          id: true,
          lastName: true,
          name: true,
        },
      }),
      prisma.waitlistEntry.count(),
    ]);

    const emails = rows.map((r) => r.email);
    const [inviteStatuses, existingEmails] = await Promise.all([
      getAccessInviteStatuses(emails),
      findExistingUserEmails(emails),
    ]);
    const entries = rows.map((r) => ({
      ...r,
      alreadyMember: existingEmails.has(r.email),
      inviteStatus: inviteStatuses.get(r.email) ?? null,
    }));

    return NextResponse.json({ entries, total, page, limit });
  } catch (error) {
    console.error("[admin/waitlist] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
