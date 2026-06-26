// ============================================================================
// POST /api/tripper/experiences/[id]/reject-copy
// Tripper rejects the admin's review copy: sets the copy to INACTIVE (kept as
// reference), transitions the original to DRAFT, and emails the admin.
// Auth: tripper role + ownership
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { sendExperienceCopyRejected } from "@/lib/email";

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    // Find original experience owned by this tripper
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = await (prisma.experience.findFirst as any)({
      where: { id: params.id, ownerId: user.id },
      select: { id: true, ownerId: true, status: true },
    }) as { id: string; ownerId: string; status: string } | null;

    if (!original) {
      return NextResponse.json(
        { error: "Experience not found or access denied" },
        { status: 404 },
      );
    }

    if (original.status !== "PENDING_TRIPPER_REVIEW") {
      return NextResponse.json(
        {
          error: "invalid_state",
          message: "Experience must be in PENDING_TRIPPER_REVIEW status to reject copy",
        },
        { status: 409 },
      );
    }

    // Find the active review copy
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
        { error: "no_copy", message: "No review copy found for this experience" },
        { status: 404 },
      );
    }

    // Transactionally: set copy to INACTIVE + set original to DRAFT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.$transaction as any)(async (tx: any) => {
      // Set copy to INACTIVE (kept as reference — not hard-deleted)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.experience.update as any)({
        where: { id: copy.id },
        data: { status: "INACTIVE", isActive: false },
      });

      // Transition original back to DRAFT
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.experience.update as any)({
        where: { id: params.id },
        data: { status: "DRAFT", isActive: false },
      });
    });

    // Fire-and-forget email to admin
    sendExperienceCopyRejected(params.id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tripper/experiences/reject-copy] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
