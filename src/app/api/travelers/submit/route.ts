import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeTravelerInvite } from "@/lib/travelers/travelerInviteTokens";

export const dynamic = "force-dynamic";

/**
 * POST /api/travelers/submit — public, token-gated. The companion invite
 * landing (`/[locale]/invite/[token]`) posts here with no session/login.
 * Consent is required client- and server-side. Re-validates the token
 * (expiry + cutoff) independently before writing. On success, fires one
 * in-app `TRAVELER_SUBMITTED` notification for the buyer — idempotent by
 * construction, since a re-submitted (already-consumed) token resolves to
 * `used` and never reaches the notification step.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, fullName, idDocument, email, consent } = body ?? {};

    if (consent !== true) {
      return NextResponse.json(
        { error: "consent_required" },
        { status: 400 },
      );
    }

    if (
      !token ||
      typeof token !== "string" ||
      !fullName ||
      typeof fullName !== "string" ||
      !idDocument ||
      typeof idDocument !== "string"
    ) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const result = await consumeTravelerInvite(token, {
      fullName,
      idDocument,
      ...(typeof email === "string" && email ? { email } : {}),
    });

    if (!result.ok) {
      return NextResponse.json({ reason: result.reason }, { status: 400 });
    }

    const trip = await prisma.tripRequest.findUnique({
      where: { id: result.tripRequestId },
      select: { userId: true },
    });

    if (trip) {
      await prisma.notification.create({
        data: {
          userId: trip.userId,
          type: "TRAVELER_SUBMITTED",
          audience: "TRAVELER",
          isRead: false,
          title: "Un acompañante completó sus datos de viaje",
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[travelers/submit] POST error:", error);
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}
