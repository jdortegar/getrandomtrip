import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { loadTripDocumentSource } from "@/lib/db/loadTripDocumentSource";
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { getProviderCandidates } from "@/lib/trip-documents/providerSnapshots";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

/** Read-only context for a local assignment; never mutates a trip or draft. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      auth.errorResponse.headers.set("Cache-Control", "private, no-store");
      return auth.errorResponse;
    }
    const { id } = await context.params;
    const params = new URL(request.url).searchParams;
    const raw = params.get("experienceId");
    if (
      params.getAll("experienceId").length > 1 ||
      (raw !== null && (raw.length > 200 || (raw !== "" && !raw.trim())))
    )
      return NextResponse.json(
        { error: "invalid_source" },
        { status: 400, headers },
      );
    const experienceId = raw === null ? undefined : raw || null;
    const trip = await prisma.tripRequest.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!trip)
      return NextResponse.json(
        { error: "trip_not_found" },
        { status: 404, headers },
      );
    const source = await withTripDocumentLocks(
      prisma,
      { ownerId: trip.userId, tripIds: [id] },
      (tx) => loadTripDocumentSource(tx, id, experienceId),
    );
    return NextResponse.json(
      {
        experienceItinerary: source.experienceItinerary,
        candidates: {
          hotel: getProviderCandidates(source.provider, "hotel"),
          activity: getProviderCandidates(source.provider, "activity"),
          dinner: getProviderCandidates(source.provider, "dinner"),
        },
      },
      { headers },
    );
  } catch (error) {
    const invalid =
      error instanceof Error &&
      error.message === "DOCUMENT_SOURCE_EXPERIENCE_UNAVAILABLE";
    return NextResponse.json(
      { error: invalid ? "source_unavailable" : "document_source_unavailable" },
      { status: invalid ? 422 : 503, headers },
    );
  }
}
