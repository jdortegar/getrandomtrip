import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_INVITE_COOKIE,
  peekAccessInvite,
} from "@/lib/auth/accessInviteTokens";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ reason: "invalid" }, { status: 400 });
    }

    const peek = await peekAccessInvite(token);

    if (!peek.ok) {
      return NextResponse.json({ reason: peek.reason }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ACCESS_INVITE_COOKIE, token, {
      httpOnly: true,
      maxAge: 600, // 10 minutes — single-use consume makes this replay-safe
      sameSite: "lax",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("[tripper-invite/oauth-init] POST", error);
    return NextResponse.json({ reason: "invalid" }, { status: 400 });
  }
}
