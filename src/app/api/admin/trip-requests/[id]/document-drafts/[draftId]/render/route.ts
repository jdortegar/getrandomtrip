import { isDocumentStorageAuthorizationError } from "@/lib/trip-documents/observeDocumentPreview";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { renderSavedDocumentDraft } from "@/lib/trip-documents/renderSavedDocumentDraft";
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

export async function POST(request: NextRequest, context: Context) {
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
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).some((key) => key !== "revision") ||
      !Number.isSafeInteger((input as { revision?: unknown }).revision) ||
      Number((input as { revision?: unknown }).revision) < 1
    )
      return json({ error: "invalid_revision" }, 422);
    const result = await renderSavedDocumentDraft(
      prisma,
      scope,
      (input as { revision: number }).revision,
    );
    if (!result.ok) return json({ errors: result.errors }, 422);
    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="document-preview.pdf"',
        "X-Content-Type-Options": "nosniff",
        "X-Document-Preview-Id": result.previewId,
        "X-Document-Revision": String(result.revision),
      },
    });
  } catch (cause) {
    if (isDocumentStorageAuthorizationError(cause))
      return json({ error: "storage_authorization" }, 503);
    const code = cause instanceof Error ? cause.message : "";
    if (code === "DOCUMENT_PDF_TOO_LARGE")
      return json({ error: "pdf_too_large" }, 413);
    if (
      [
        "DOCUMENT_PREVIEW_REVISION_CONFLICT",
        "DOCUMENT_CANDIDATE_UNAVAILABLE",
        "DOCUMENT_LOCK_SCOPE_MISMATCH",
      ].includes(code)
    )
      return json({ error: "preview_conflict" }, 409);
    return json({ error: "preview_unavailable" }, 503);
  }
}
