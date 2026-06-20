// ============================================================================
// POST /api/admin/experiences/[id]/send-to-tripper
// Computes changedFields, stores them on the copy, transitions the original
// to PENDING_TRIPPER_REVIEW, clears reviewLockedBy, and emails the tripper.
// Auth: admin role only
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { computeChangedFields } from "@/lib/experiences/changed-fields";
import { sendExperiencePendingTripperReview } from "@/lib/email";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = await (prisma.experience.findUnique as any)({
      where: { id: params.id },
    }) as Record<string, unknown> | null;

    if (!original) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    // Find the active (non-INACTIVE) review copy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const copy = await (prisma.experience.findFirst as any)({
      where: {
        parentId: params.id,
        isReviewCopy: true,
        NOT: { status: "INACTIVE" },
      },
    }) as Record<string, unknown> | null;

    if (!copy) {
      return NextResponse.json(
        { error: "no_copy", message: "No review copy found for this experience" },
        { status: 404 },
      );
    }

    // Compute changed fields
    const changedFields = computeChangedFields(copy, original);

    if (changedFields.length === 0) {
      return NextResponse.json(
        {
          error: "no_changes",
          message: "No fields were changed in the review copy. Make edits before sending to tripper.",
        },
        { status: 422 },
      );
    }

    // Transactionally: store changedFields on copy, transition original, clear lock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.$transaction as any)(async (tx: any) => {
      // Update copy with changedFields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.experience.update as any)({
        where: { id: copy.id as string },
        data: { changedFields },
      });

      // Transition original to PENDING_TRIPPER_REVIEW and clear lock
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.experience.update as any)({
        where: { id: params.id },
        data: {
          status: "PENDING_TRIPPER_REVIEW",
          reviewLockedBy: null,
        },
      });
    });

    // Fire-and-forget: email + system notification to tripper
    sendExperiencePendingTripperReview(params.id, original.ownerId as string);

    void (async () => {
      try {
        const owner = await prisma.user.findUnique({
          where: { id: original.ownerId as string },
          select: { locale: true },
        });
        const locale = owner?.locale === "en" ? "en" : "es";
        const title = original.title as string;
        const dict = locale === "en" ? enCopy.adminExperienceReview : esCopy.adminExperienceReview;
        await prisma.notification.create({
          data: {
            userId: original.ownerId as string,
            type: "EXPERIENCE_PENDING_TRIPPER_REVIEW",
            audience: "TRIPPER",
            isRead: false,
            title: dict.notifTitle,
            body: dict.notifBody.replace("{title}", title),
            metadata: { experienceId: params.id },
          },
        });
      } catch (err) {
        console.error("[send-to-tripper] notification create:", err);
      }
    })();

    return NextResponse.json({ changedFields });
  } catch (error) {
    console.error("[admin/experiences/send-to-tripper] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
