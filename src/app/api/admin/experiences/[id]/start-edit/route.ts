// ============================================================================
// POST /api/admin/experiences/[id]/start-edit
// Creates a lazy review copy of a PENDING_REVIEW experience and sets a soft
// lock on the original. Idempotent: if the same admin already holds the lock
// and a copy exists, returns the existing copy id.
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (prisma.$transaction as any)(async (tx: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const original = await (tx.experience.findUnique as any)({
        where: { id: params.id },
      }) as Record<string, unknown> | null;

      if (!original) {
        return { notFound: true };
      }

      if (original.status !== "PENDING_REVIEW") {
        return { invalidState: true, status: original.status };
      }

      // Check if another admin holds the lock
      if (original.reviewLockedBy && original.reviewLockedBy !== caller.id) {
        return { locked: true, lockedBy: original.reviewLockedBy as string };
      }

      // Check for an existing non-INACTIVE copy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingCopy = await (tx.experience.findFirst as any)({
        where: {
          parentId: params.id,
          isReviewCopy: true,
          NOT: { status: "INACTIVE" },
        },
        select: { id: true },
      }) as { id: string } | null;

      // Idempotent: if the current admin already holds the lock and copy exists
      if (existingCopy && original.reviewLockedBy === caller.id) {
        return { copyId: existingCopy.id, created: false };
      }

      // Create the review copy — omit identity fields: id, ownerId, createdAt, slug
      const {
        id: _id,
        ownerId: _ownerId,
        createdAt: _createdAt,
        slug: _slug,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        isReviewCopy: _irc,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        parentId: _pid,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        reviewLockedBy: _rlb,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        changedFields: _cf,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        updatedAt: _updatedAt,
        ...copyableFields
      } = original;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const copy = await (tx.experience.create as any)({
        data: {
          ...copyableFields,
          ownerId: original.ownerId as string,
          isReviewCopy: true,
          parentId: params.id,
          status: "DRAFT",
          isActive: false,
          slug: null,
          changedFields: [],
          reviewLockedBy: null,
          reviewNote: null,
        },
        select: { id: true },
      }) as { id: string };

      // Set the soft lock on the original
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.experience.update as any)({
        where: { id: params.id },
        data: { reviewLockedBy: caller.id },
      });

      return { copyId: copy.id, created: true };
    });

    if (result.notFound) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    if (result.invalidState) {
      return NextResponse.json(
        { error: "invalid_state", message: "Experience must be in PENDING_REVIEW status" },
        { status: 409 },
      );
    }

    if (result.locked) {
      // Fetch locker info for response
      const locker = await prisma.user.findUnique({
        where: { id: result.lockedBy },
        select: { id: true, name: true, email: true },
      });
      return NextResponse.json(
        {
          error: "locked",
          message: "Experience is already locked by another admin",
          lockedBy: result.lockedBy,
          lockerInfo: locker,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { copyId: result.copyId },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    console.error("[admin/experiences/start-edit] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
