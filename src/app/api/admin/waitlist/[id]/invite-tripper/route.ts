import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { issueTripperInvite } from "@/lib/auth/tripperInviteTokens";
import { sendTripperInviteEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
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

    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: params.id },
      select: { email: true },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 },
      );
    }

    const token = await issueTripperInvite(entry.email);
    sendTripperInviteEmail(entry.email, token, "es"); // fire-and-forget

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/waitlist/[id]/invite-tripper] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
