import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { createTripDocumentDraft } from "@/lib/db/createTripDocumentDraft";
import { loadTripDocumentSource } from "@/lib/db/loadTripDocumentSource";
import { withTripDocumentLocks } from "@/lib/db/tripDocumentLocks";
import { toDraftDto } from "@/lib/trip-documents/draftContracts";
import { getProviderCandidates } from "@/lib/trip-documents/providerSnapshots";
import { MAX_DOCUMENT_REQUEST_BYTES } from "@/lib/trip-documents/validationPrimitives";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers });
}
async function readInput(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_DOCUMENT_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Error("REQUEST_TOO_LARGE");
      }
      chunks.push(value);
    }
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        Buffer.concat(chunks, size),
      ),
    );
  } finally {
    reader.releaseLock();
  }
}

async function handle(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  create: boolean,
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      auth.errorResponse.headers.set("Cache-Control", "private, no-store");
      return auth.errorResponse;
    }
    const { id } = await context.params;
    const trip = await prisma.tripRequest.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!trip) return json({ error: "trip_not_found" }, 404);
    if (create) {
      let input: unknown;
      try {
        input = await readInput(request);
      } catch (cause) {
        return json(
          {
            error:
              cause instanceof Error && cause.message === "REQUEST_TOO_LARGE"
                ? "request_too_large"
                : "invalid_body",
          },
          cause instanceof Error && cause.message === "REQUEST_TOO_LARGE"
            ? 413
            : 400,
        );
      }
      const result = await createTripDocumentDraft(
        prisma,
        { ownerId: trip.userId, tripRequestId: id },
        input,
        loadTripDocumentSource,
      );
      if (!result.ok) return json(result, 422);
      return json(result.value, 201);
    }
    const result = await withTripDocumentLocks(
      prisma,
      { ownerId: trip.userId, tripIds: [id] },
      async (tx) => {
        const rows = await tx.tripDocumentDraft.findMany({
          where: { tripRequestId: id },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });
        const source = await loadTripDocumentSource(tx, id);
        return {
          drafts: rows.map(toDraftDto),
          candidates: {
            hotel: getProviderCandidates(source.provider, "hotel"),
            activity: getProviderCandidates(source.provider, "activity"),
            dinner: getProviderCandidates(source.provider, "dinner"),
          },
        };
      },
    );
    return json(result);
  } catch {
    return json({ error: "drafts_unavailable" }, 503);
  }
}
export function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handle(request, context, false);
}
export function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handle(request, context, true);
}
