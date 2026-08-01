import { NextRequest, NextResponse } from "next/server";
import { peekTravelerInvite } from "@/lib/travelers/travelerInviteTokens";

export const dynamic = "force-dynamic";

/**
 * Mints the short-lived `grt_traveler_invite` cookie that `authorize()`
 * reads to bypass `EMAIL_NOT_VERIFIED` for a companion holding a live,
 * unconsumed invite. Called by `TravelerInviteClient` right before it opens
 * `AuthModal` — a failed/rejected call still opens the modal (fail-closed:
 * the exception simply won't apply). Clone of
 * `api/tripper-invite/oauth-init/route.ts`.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ reason: "invalid" }, { status: 400 });
    }

    const peek = await peekTravelerInvite(token);

    if (!peek.ok) {
      return NextResponse.json({ reason: peek.reason }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("grt_traveler_invite", token, {
      httpOnly: true,
      maxAge: 600, // 10 minutes — single-use consume makes this replay-safe
      sameSite: "lax",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("[travelers/invite-auth-init] POST", error);
    return NextResponse.json({ reason: "invalid" }, { status: 400 });
  }
}
