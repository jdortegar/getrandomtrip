import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { sendReviewApprovedForTripper } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({
      select: { id: true, roles: true },
      where: { id: session.user.id },
    });
    if (!caller || !hasRoleAccess(caller, "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      isApproved?: unknown;
      isPublic?: unknown;
    };

    if (typeof body.isApproved !== "boolean") {
      return NextResponse.json(
        { error: "isApproved (boolean) is required" },
        { status: 400 },
      );
    }

    // Fetch current state to detect the false → true transition and check ownership
    const existing = await prisma.review.findUnique({
      select: { id: true, isApproved: true, tripperId: true },
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // isPublic is only admin-writable for platform reviews (tripperId: null).
    // For tripper-owned reviews, isPublic is tripper-controlled.
    if (typeof body.isPublic === "boolean" && existing.tripperId !== null) {
      return NextResponse.json(
        { error: "isPublic is controlled by the tripper for tripper reviews" },
        { status: 403 },
      );
    }

    const updateData: { isApproved: boolean; isPublic?: boolean } = {
      isApproved: body.isApproved,
    };

    // Only apply isPublic for platform (tripperId: null) reviews
    if (typeof body.isPublic === "boolean" && existing.tripperId === null) {
      updateData.isPublic = body.isPublic;
    }

    const review = await prisma.review.update({
      data: updateData,
      select: { id: true, isApproved: true, isPublic: true, tripperId: true },
      where: { id: params.id },
    });

    // Approval transition: notify tripper in-app + email (tripper reviews only)
    const wasJustApproved = !existing.isApproved && body.isApproved;
    if (wasJustApproved && review.tripperId) {
      try {
        await prisma.notification.create({
          data: {
            userId: review.tripperId,
            type: "REVIEW_APPROVED",
            audience: "TRIPPER",
            isRead: false,
            title: "Tienes una nueva reseña aprobada",
            metadata: { reviewId: review.id },
          },
        });
      } catch (err) {
        console.error("[admin/reviews/[id]] notification create:", err);
      }

      sendReviewApprovedForTripper(review.tripperId, review.id);
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("[admin/reviews/[id]] PATCH", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
