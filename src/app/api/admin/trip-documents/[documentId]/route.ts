import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { deletePublishedDocument } from "@/lib/db/deletePublishedDocument";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ documentId: string }> };
const headers = { "Cache-Control": "private, no-store" };

/** Any live admin may delete an attachment, regardless of its uploader.
 * The transaction retains exact-key cleanup intents; storage I/O belongs to
 * the worker, never this request or its database transaction.
 */
export async function DELETE(
  _request: NextRequest,
  props: RouteContext,
): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      auth.errorResponse.headers.set("Cache-Control", "private, no-store");
      return auth.errorResponse;
    }
    const { documentId } = await props.params;
    const document = await prisma.tripDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        tripRequestId: true,
        tripRequest: { select: { userId: true } },
      },
    });
    if (!document)
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers },
      );
    await deletePublishedDocument(prisma, {
      ownerId: document.tripRequest.userId,
      tripRequestId: document.tripRequestId,
      documentId: document.id,
    });
    return new NextResponse(null, { status: 204, headers });
  } catch (error) {
    const conflict =
      error instanceof Error &&
      error.message === "DOCUMENT_LOCK_SCOPE_MISMATCH";
    return NextResponse.json(
      { error: conflict ? "document_conflict" : "delete_unavailable" },
      { status: conflict ? 409 : 503, headers },
    );
  }
}
