import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { readTripDocumentDraft } from "@/lib/db/createTripDocumentDraft";
import { updateTripDocumentDraft } from "@/lib/db/updateTripDocumentDraft";
import { MAX_DOCUMENT_REQUEST_BYTES } from "@/lib/trip-documents/validationPrimitives";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
interface Context {
  params: Promise<{ id: string; draftId: string }>;
}
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

async function handle(request: NextRequest, context: Context, update: boolean) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      auth.errorResponse.headers.set("Cache-Control", "private, no-store");
      return auth.errorResponse;
    }
    const { id, draftId } = await context.params;
    const trip = await prisma.tripRequest.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!trip) return json({ error: "trip_not_found" }, 404);
    const draft = await prisma.tripDocumentDraft.findFirst({
      where: { id: draftId, tripRequestId: id },
      select: { id: true },
    });
    if (!draft) return json({ error: "draft_not_found" }, 404);
    const scope = { ownerId: trip.userId, tripRequestId: id, draftId };
    if (!update) {
      const result = await readTripDocumentDraft(prisma, scope);
      return result ? json(result) : json({ error: "draft_not_found" }, 404);
    }
    let input: unknown;
    try {
      input = await readInput(request);
    } catch (cause) {
      const large =
        cause instanceof Error && cause.message === "REQUEST_TOO_LARGE";
      return json(
        { error: large ? "request_too_large" : "invalid_body" },
        large ? 413 : 400,
      );
    }
    const result = await updateTripDocumentDraft(prisma, scope, input);
    if (result.ok) return json(result.value);
    if ("error" in result)
      return json(
        { error: result.error },
        result.error === "draft_not_found" ? 404 : 409,
      );
    return json({ errors: result.errors }, 422);
  } catch {
    return json({ error: "draft_unavailable" }, 503);
  }
}
export function GET(request: NextRequest, context: Context) {
  return handle(request, context, false);
}
export function PATCH(request: NextRequest, context: Context) {
  return handle(request, context, true);
}
