import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { prisma } from "@/lib/prisma";
import { readDocumentPreview } from "@/lib/storage/readDocumentPreview";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
function error(code: string, status: number) {
  return NextResponse.json({ error: code }, { status, headers });
}
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; draftId: string }> },
) {
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
    if (!trip) return error("trip_not_found", 404);
    const draft = await prisma.tripDocumentDraft.findFirst({
      where: { id: draftId, tripRequestId: id },
      select: { id: true },
    });
    if (!draft) return error("draft_not_found", 404);
    const query = request.nextUrl.searchParams;
    const raw = query.get("revision") ?? "";
    const previewId = query.get("previewId") ?? "";
    const revision = Number(raw);
    if (
      [...query.keys()].some(
        (key) => !["revision", "previewId"].includes(key),
      ) ||
      query.getAll("revision").length !== 1 ||
      query.getAll("previewId").length !== 1 ||
      !/^\d+$/.test(raw) ||
      !Number.isSafeInteger(revision) ||
      revision < 1 ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(previewId)
    )
      return error("invalid_preview_identity", 422);
    const bytes = await readDocumentPreview(
      prisma,
      { ownerId: trip.userId, tripRequestId: id, draftId },
      revision,
      previewId,
    );
    if (bytes.length > 4 * 1024 * 1024) return error("pdf_too_large", 413);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="document-preview.pdf"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (cause) {
    const code = cause instanceof Error ? cause.message : "";
    return [
      "DOCUMENT_PREVIEW_CONFLICT",
      "DOCUMENT_LOCK_SCOPE_MISMATCH",
    ].includes(code)
      ? error("preview_conflict", 409)
      : error("preview_unavailable", 503);
  }
}
