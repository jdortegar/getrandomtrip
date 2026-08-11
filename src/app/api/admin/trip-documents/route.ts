import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { isDestinationCountryCode } from "@/lib/trips/destinationCountries";
import { isAllowedDocumentMime } from "@/lib/upload/documentMimeTypes";
import { buildTripDocumentKey, getTripDocumentStore } from "@/lib/storage/tripDocumentStore";
import { toTripDocumentDTO } from "@/lib/trips/tripDocumentDto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * `POST /api/admin/trip-documents` — dedicated server-side multipart admin
 * route. Deliberately NOT `POST /api/upload`: a two-step upload would
 * serialize the document blob URL to the client, and
 * `GET /api/upload/[...path]` is unauthenticated (design.md ADR-1).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const formData = await request.formData();
    const tripRequestId = formData.get("tripRequestId");
    const labelRaw = formData.get("label");
    const country = formData.get("country");
    const file = formData.get("file");

    if (typeof tripRequestId !== "string" || !tripRequestId) {
      return NextResponse.json(
        { error: "invalid_request", field: "tripRequestId" },
        { status: 400 },
      );
    }
    if (typeof labelRaw !== "string") {
      return NextResponse.json(
        { error: "invalid_request", field: "label" },
        { status: 400 },
      );
    }
    const label = labelRaw.trim();
    if (label.length < 1 || label.length > 120) {
      return NextResponse.json(
        { error: "invalid_request", field: "label" },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "invalid_request", field: "file" },
        { status: 400 },
      );
    }

    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripRequestId },
      select: { id: true },
    });
    if (!trip) {
      return NextResponse.json({ error: "trip_not_found" }, { status: 404 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }
    if (!isAllowedDocumentMime(file.type)) {
      return NextResponse.json(
        { error: "unsupported_file_type" },
        { status: 415 },
      );
    }
    if (!isDestinationCountryCode(country)) {
      return NextResponse.json({ error: "invalid_country" }, { status: 422 });
    }

    const storageKey = buildTripDocumentKey(tripRequestId);

    try {
      const store = getTripDocumentStore();
      const buffer = Buffer.from(await file.arrayBuffer());
      await store.set(storageKey, new Uint8Array(buffer).buffer, {
        metadata: { contentType: file.type },
      });
    } catch (storageError) {
      console.error("[admin/trip-documents] storage write failed", storageError);
      return NextResponse.json(
        { error: "storage_unavailable" },
        { status: 503 },
      );
    }

    const document = await prisma.tripDocument.create({
      data: {
        tripRequestId,
        label,
        country,
        storageKey,
        mimeType: file.type,
        originalFilename: file.name,
        sizeBytes: file.size,
        uploadedById: auth.adminId,
      },
    });

    return NextResponse.json(
      { document: toTripDocumentDTO(document) },
      { status: 201 },
    );
  } catch (error) {
    console.error("[admin/trip-documents] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
