import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { isDocumentStorageAuthorizationError } from "@/lib/trip-documents/observeDocumentPreview";
import { attachDocumentDraft } from "@/lib/trip-documents/attachDocumentDraft";
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
async function readInput(
  request: NextRequest,
  binary: boolean,
): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > (binary ? 4 * 1024 * 1024 : MAX_DOCUMENT_REQUEST_BYTES)) {
        await reader.cancel().catch(() => undefined);
        throw new Error("REQUEST_TOO_LARGE");
      }
      chunks.push(value);
    }
    if (binary) return Buffer.concat(chunks, size);
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
    const binary =
      request.headers.get("content-type")?.split(";")[0].trim() ===
      "application/pdf";
    let previewBytes: Buffer | undefined;
    let input: unknown;
    try {
      input = await readInput(request, binary);
      if (binary) {
        previewBytes = input as Buffer;
        const replaceDocumentId = request.headers.get("x-document-replace-id");
        input = {
          revision: Number(request.headers.get("x-document-revision")),
          previewId: request.headers.get("x-document-preview-id"),
          requestId: request.headers.get("x-document-request-id"),
          ...(replaceDocumentId === null ? {} : { replaceDocumentId }),
        };
      }
    } catch (cause) {
      const large =
        cause instanceof Error && cause.message === "REQUEST_TOO_LARGE";
      return json(
        { error: large ? "request_too_large" : "invalid_body" },
        large ? 413 : 400,
      );
    }
    if (!input || typeof input !== "object" || Array.isArray(input))
      return json({ error: "invalid_attach" }, 422);
    const raw = input as Record<string, unknown>;
    const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
    if (
      Object.keys(raw).some(
        (key) =>
          !["revision", "previewId", "requestId", "replaceDocumentId"].includes(
            key,
          ),
      ) ||
      !Number.isSafeInteger(raw.revision) ||
      Number(raw.revision) < 1 ||
      typeof raw.previewId !== "string" ||
      !uuid.test(raw.previewId) ||
      typeof raw.requestId !== "string" ||
      !uuid.test(raw.requestId) ||
      (raw.replaceDocumentId !== undefined &&
        (typeof raw.replaceDocumentId !== "string" ||
          !raw.replaceDocumentId.trim() ||
          raw.replaceDocumentId.length > 200))
    )
      return json({ error: "invalid_attach" }, 422);
    const result = await attachDocumentDraft(prisma, {
      ...scope,
      adminId: auth.adminId,
      revision: raw.revision as number,
      previewId: raw.previewId,
      requestId: raw.requestId,
      ...(previewBytes === undefined ? {} : { previewBytes }),
      ...(raw.replaceDocumentId === undefined
        ? {}
        : { replaceDocumentId: raw.replaceDocumentId as string }),
    });
    return json({
      documentId: result.documentId,
      revision: raw.revision,
      status: result.status,
    });
  } catch (cause) {
    if (isDocumentStorageAuthorizationError(cause))
      return json({ error: "storage_authorization" }, 503);
    const code = cause instanceof Error ? cause.message : "";
    const recoverable: Record<string, string> = {
      DOCUMENT_ATTACH_RETRY_UNAVAILABLE: "attach_in_progress",
      DOCUMENT_ATTACH_REQUEST_EXPIRED: "attach_request_expired",
      DOCUMENT_ATTACH_REQUEST_MISMATCH: "attach_request_mismatch",
      DOCUMENT_REPLACEMENT_REQUIRED: "replacement_required",
      DOCUMENT_REPLACEMENT_MISMATCH: "replacement_mismatch",
      DOCUMENT_MEMORY_PREVIEW_EXPIRED: "preview_conflict",
      DOCUMENT_PUBLICATION_CONFLICT: "preview_conflict",
      DOCUMENT_PREVIEW_CONFLICT: "preview_conflict",
      DOCUMENT_CANDIDATE_UNAVAILABLE: "preview_conflict",
      DOCUMENT_LOCK_SCOPE_MISMATCH: "preview_conflict",
      DOCUMENT_PUBLICATION_LINK_MISSING: "attachment_missing",
    };
    if (recoverable[code]) return json({ error: recoverable[code] }, 409);
    if (code === "INVALID_DOCUMENT_PDF")
      return json({ error: "invalid_attach" }, 422);
    if (code === "DOCUMENT_PDF_TOO_LARGE")
      return json({ error: "pdf_too_large" }, 413);
    return json({ error: "attach_unavailable" }, 503);
  }
}
