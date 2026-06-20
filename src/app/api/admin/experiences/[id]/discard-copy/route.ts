// ============================================================================
// POST /api/admin/experiences/[id]/discard-copy
// Hard-deletes the review copy and clears reviewLockedBy on the original.
// The original remains in PENDING_REVIEW.
// Auth: admin role only
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!caller || !hasRoleAccess(caller, "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the active (non-INACTIVE) review copy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const copy = await (prisma.experience.findFirst as any)({
      where: {
        parentId: params.id,
        isReviewCopy: true,
        NOT: { status: "INACTIVE" },
      },
      select: { id: true },
    }) as { id: string } | null;

    if (!copy) {
      return NextResponse.json(
        { error: "no_copy", message: "No active review copy found for this experience" },
        { status: 404 },
      );
    }

    // Transactionally: delete the copy + clear lock on original
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.$transaction as any)(async (tx: any) => {
      // Hard-delete the copy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.experience.delete as any)({
        where: { id: copy.id },
      });

      // Clear the lock on the original; status stays PENDING_REVIEW
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.experience.update as any)({
        where: { id: params.id },
        data: { reviewLockedBy: null },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/experiences/discard-copy] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
