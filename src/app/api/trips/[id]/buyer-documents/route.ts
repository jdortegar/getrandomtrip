import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PROFILE_DOCUMENTS_SELECT,
  profileTravelDocuments,
} from "@/lib/travelers/effectiveTravelDocuments";
import { parseTravelerDocumentCodes } from "@/lib/travelers/travelerPolicy";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/trips/[id]/buyer-documents — the trip owner's nationalities and
 * visas. Linked = live: the buyer always has an account, so their documents
 * live on their profile (`User.nationalities` / `User.approvedVisas`) and are
 * read from there by every trip view; nothing is written to the trip. Like the
 * profile's Documents tab, no roster lock applies; only a cancelled trip
 * refuses edits (409). A list left out of the body stays unchanged; sent
 * nationalities need at least one code.
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const parsed = parseTravelerDocumentCodes(body as Record<string, unknown>);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error, invalid: parsed.invalid },
        { status: 400 },
      );
    }
    if (parsed.nationalities === undefined && parsed.visas === undefined) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (parsed.nationalities?.length === 0) {
      return NextResponse.json(
        { error: "At least one nationality is required", invalid: [] },
        { status: 400 },
      );
    }

    const { id } = await props.params;
    const trip = await prisma.tripRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    if (trip.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (trip.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Trip is no longer editable" },
        { status: 409 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.nationalities !== undefined && {
          nationalities: parsed.nationalities,
        }),
        ...(parsed.visas !== undefined && { approvedVisas: parsed.visas }),
      },
      select: PROFILE_DOCUMENTS_SELECT,
    });
    const documents = profileTravelDocuments(updated);

    return NextResponse.json({
      buyerNationalities: documents.nationalities,
      buyerVisas: documents.visas,
    });
  } catch (error) {
    console.error("Error saving buyer travel documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
