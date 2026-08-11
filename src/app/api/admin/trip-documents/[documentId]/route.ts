import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getTripDocumentStore } from "@/lib/storage/tripDocumentStore";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ documentId: string }> };

/**
 * Admin-role-based delete, NOT upload-ownership (Resolved Decision #2). Any
 * admin can remove any trip's document, regardless of which admin uploaded
 * it. Row is deleted first, then the blob is removed best-effort — a
 * dangling row is never acceptable, an orphaned blob in a private store is.
 * Never proxies through `DELETE /api/upload/[...path]`, which would
 * re-apply the uploader-ownership check this route deliberately does not
 * inherit.
 */
export async function DELETE(
  _request: NextRequest,
  props: RouteContext,
): Promise<NextResponse> {
  const { documentId } = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const document = await prisma.tripDocument.findUnique({
      where: { id: documentId },
      select: { id: true, storageKey: true },
    });
    if (!document) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await prisma.tripDocument.delete({ where: { id: document.id } });

    try {
      const store = getTripDocumentStore();
      await store.delete(document.storageKey);
    } catch (storageError) {
      console.error(
        "[admin/trip-documents/:id] best-effort blob delete failed",
        storageError,
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[admin/trip-documents/:id] DELETE", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
