import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeTravelerInvite } from "@/lib/travelers/travelerInviteTokens";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

export const dynamic = "force-dynamic";

/**
 * POST /api/travelers/submit — session + token gated. The token still
 * answers WHICH row; the session now answers WHO claims it. Payload
 * narrows to `{ token, idDocument, consent }` — `fullName`/`email` are
 * ALWAYS derived server-side from the authenticated user, never trusted
 * from the client. Re-validates the token (expiry + cutoff) independently
 * before writing. On success, sets `TripTraveler.userId` and fires one
 * in-app `TRAVELER_SUBMITTED` notification for the buyer — idempotent by
 * construction, since a re-submitted (already-consumed) token resolves to
 * `used` and never reaches the notification step.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token, idDocument, consent } = body ?? {};

    if (consent !== true) {
      return NextResponse.json(
        { error: "consent_required" },
        { status: 400 },
      );
    }

    if (!token || typeof token !== "string" || !idDocument || typeof idDocument !== "string") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const sessionUserId = (session.user as { id?: string }).id;
    if (!sessionUserId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, name: true, email: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await consumeTravelerInvite(token, {
      fullName: dbUser.name,
      idDocument,
      email: dbUser.email,
      userId: dbUser.id,
    });

    if (!result.ok) {
      return NextResponse.json({ reason: result.reason }, { status: 400 });
    }

    const trip = await prisma.tripRequest.findUnique({
      where: { id: result.tripRequestId },
      select: { userId: true, user: { select: { locale: true } } },
    });

    if (trip) {
      const locale = trip.user?.locale === "en" ? "en" : "es";
      const dict = locale === "en" ? enCopy.inviteTravelers : esCopy.inviteTravelers;
      await prisma.notification.create({
        data: {
          userId: trip.userId,
          type: "TRAVELER_SUBMITTED",
          audience: "TRAVELER",
          isRead: false,
          title: dict.notifTitle,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[travelers/submit] POST error:", error);
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}
