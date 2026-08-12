import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { canAccessTrip } from "@/lib/travelers/travelerAccess";
import { isFulfillmentVisible } from "@/lib/trips/fulfillmentVisibility";
import { getTripDocumentStore } from "@/lib/storage/tripDocumentStore";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; documentId: string }> };

/**
 * Authenticated, per-trip-authorized document stream route (Resolved
 * Decision #1). Authorization: `canAccessTrip` (buyer + companions) OR
 * `hasRoleAccess(caller, "admin")` as a SEPARATE condition — `canAccessTrip`
 * is never widened. Non-admin callers are additionally gated by
 * `isFulfillmentVisible`; admins are exempt (they author pre-reveal).
 */
export async function GET(
  request: NextRequest,
  props: RouteContext,
): Promise<NextResponse> {
  const { id: tripId, documentId } = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, roles: true },
    });
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      select: { id: true, userId: true, status: true },
    });
    if (!trip) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const isAdmin = hasRoleAccess(caller, "admin");
    const authorized = isAdmin || (await canAccessTrip(trip.id, caller.id));
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isFulfillmentVisible(trip.status, isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const document = await prisma.tripDocument.findUnique({
      where: { id: documentId },
    });
    if (!document || document.tripRequestId !== trip.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const store = getTripDocumentStore();
    const blob = await store.get(document.storageKey, { type: "blob" });
    if (!blob) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    const disposition = download ? "attachment" : "inline";

    return new NextResponse(blob as unknown as BodyInit, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `${disposition}; filename="${document.originalFilename}"`,
        // Stricter than the image route's max-age=86400 — this is PII.
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[trips/:id/documents/:documentId] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
