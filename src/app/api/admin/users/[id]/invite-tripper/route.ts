import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { issueTripperInvite } from "@/lib/auth/tripperInviteTokens";
import { sendTripperInviteEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function resolveLocale(locale: string | null | undefined): "es" | "en" {
  return locale === "en" ? "en" : "es";
}

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

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { email: true, locale: true, roles: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.roles.includes("TRIPPER") || target.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "User already has TRIPPER or ADMIN role" },
        { status: 400 },
      );
    }

    const token = await issueTripperInvite(target.email);
    sendTripperInviteEmail(
      target.email,
      token,
      resolveLocale(target.locale),
    ); // fire-and-forget

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/users/[id]/invite-tripper] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
