import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  consumeTripperInvite,
  grantTripperAndCleanup,
} from "@/lib/auth/tripperInviteTokens";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ reason: "invalid" }, { status: 400 });
    }

    const result = await consumeTripperInvite(token);

    if (!result.ok) {
      return NextResponse.json({ reason: result.reason }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: result.email },
      select: { id: true },
    });

    if (!user) {
      // Defensive guard — the accept page peeks first and routes users with
      // no existing account to the register form instead of this endpoint.
      return NextResponse.json({ reason: "no_account" }, { status: 409 });
    }

    await grantTripperAndCleanup(user.id, result.email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[tripper-invite/accept] POST", error);
    return NextResponse.json({ reason: "invalid" }, { status: 400 });
  }
}
