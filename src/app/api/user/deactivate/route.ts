import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TripRequestStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const ACTIVE_TRIP_STATUSES: TripRequestStatus[] = [
  "DRAFT",
  "SAVED",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "REVEALED",
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      select: { id: true, roles: true },
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "blocked", reasons: ["ADMIN_ROLE"] },
        { status: 409 },
      );
    }

    const [activeTripCount, ownedExperienceCount] = await Promise.all([
      prisma.tripRequest.count({
        where: { userId: user.id, status: { in: ACTIVE_TRIP_STATUSES } },
      }),
      prisma.experience.count({ where: { ownerId: user.id } }),
    ]);

    const reasons: string[] = [];
    if (activeTripCount > 0) reasons.push("ACTIVE_TRIPS");
    if (ownedExperienceCount > 0) reasons.push("OWNED_EXPERIENCES");

    if (reasons.length > 0) {
      return NextResponse.json({ error: "blocked", reasons }, { status: 409 });
    }

    // Soft-delete: deactivate, don't destroy any data. Signing back in (see
    // the signIn callback in src/lib/auth.ts) clears this and restores the
    // account exactly as it was.
    await prisma.user.update({
      data: { deactivatedAt: new Date(), isActive: false },
      where: { id: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[user/deactivate] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
