import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRosterLocked, serializeTraveler } from "@/lib/travelers/travelerRoster";

/**
 * PATCH /api/travelers/[id] — buyer edits a single traveler row (adult or
 * minor). Single-row update only: this endpoint never adds or removes rows,
 * the roster size is fixed at payment success.
 *
 * Minor rows require all three fields (`fullName`, `dateOfBirth`,
 * `idDocument`) to be present in the same request — an incomplete minor save
 * is rejected outright (400), nothing is persisted. Adult rows accept
 * partial saves; the row only flips to `COMPLETE` once `fullName`, `email`,
 * and `idDocument` are all present, otherwise the existing status is kept.
 * A row already `COMPLETE` is never downgraded.
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const traveler = await prisma.tripTraveler.findUnique({
      where: { id: params.id },
      include: { tripRequest: true },
    });

    if (!traveler) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (traveler.tripRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isRosterLocked(traveler.tripRequest)) {
      return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    const body = await request.json();

    const fullName =
      body.fullName !== undefined ? body.fullName : traveler.fullName;
    const email = body.email !== undefined ? body.email : traveler.email;
    const idDocument =
      body.idDocument !== undefined ? body.idDocument : traveler.idDocument;
    const dateOfBirth =
      body.dateOfBirth !== undefined
        ? new Date(body.dateOfBirth)
        : traveler.dateOfBirth;

    if (traveler.kind === "MINOR") {
      const complete = Boolean(fullName) && Boolean(dateOfBirth) && Boolean(idDocument);
      if (!complete) {
        return NextResponse.json(
          { error: "incomplete", message: "fill in all fields" },
          { status: 400 },
        );
      }
    }

    const isComplete =
      traveler.kind === "MINOR"
        ? true
        : Boolean(fullName) && Boolean(email) && Boolean(idDocument);

    const nextStatus =
      traveler.status === "COMPLETE"
        ? "COMPLETE"
        : isComplete
          ? "COMPLETE"
          : traveler.status;

    const justCompleted = nextStatus === "COMPLETE" && traveler.status !== "COMPLETE";

    const updated = await prisma.tripTraveler.update({
      where: { id: params.id },
      data: {
        fullName,
        email,
        idDocument,
        dateOfBirth,
        status: nextStatus,
        ...(justCompleted && { submittedAt: new Date() }),
      },
    });

    return NextResponse.json({ traveler: serializeTraveler(updated) });
  } catch (error) {
    console.error("[travelers/[id]] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
