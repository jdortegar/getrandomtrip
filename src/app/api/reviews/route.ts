import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// POST /api/reviews — public endpoint, token-based auth, no session required
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = typeof body?.token === "string" ? body.token.trim() : null;
    const rating = body?.rating;
    const content =
      typeof body?.content === "string" ? body.content.trim() : null;
    const title =
      typeof body?.title === "string" ? body.title.trim() || null : null;

    // Validate token presence
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Lookup TripRequest by reviewToken — include experience owner to derive
    // tripperId for RandomTrips that use a tripper-owned experience.
    const tripRequest = await prisma.tripRequest.findUnique({
      where: { reviewToken: token },
      select: {
        id: true,
        userId: true,
        tripperId: true,
        type: true,
        reviewSubmittedAt: true,
        actualDestination: true,
        experience: {
          select: {
            ownerId: true,
            source: true,
          },
        },
      },
    });

    if (!tripRequest) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 404 },
      );
    }

    // Check for duplicate submission
    if (tripRequest.reviewSubmittedAt) {
      return NextResponse.json(
        { error: "Review already submitted for this trip" },
        { status: 409 },
      );
    }

    // Validate rating: integer 1–5
    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    // Validate content
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    // Derive effective tripperId: prefer TripRequest.tripperId; fall back to
    // experience.ownerId when the experience's immutable source is TRIPPER
    // (RANDOMTRIP-sourced experiences attribute no tripper commission).
    let effectiveTripperId = tripRequest.tripperId;
    if (!effectiveTripperId && tripRequest.experience) {
      const ownerIsTripper = tripRequest.experience.source === "TRIPPER";
      if (ownerIsTripper) {
        effectiveTripperId = tripRequest.experience.ownerId;
      }
    }

    // Fetch tripper name for notification title (outside transaction — read-only)
    const tripper = effectiveTripperId
      ? await prisma.user.findUnique({
          where: { id: effectiveTripperId },
          select: { name: true },
        })
      : null;

    const notificationTitle = tripper?.name
      ? `Nueva reseña para ${tripper.name}`
      : "Nueva reseña (RandomTrip)";

    // Fetch all admin user ids for notifications
    const admins = await prisma.user.findMany({
      where: { roles: { has: "ADMIN" } },
      select: { id: true },
    });

    // Transactionally create Review + update TripRequest + notify admins
    await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId: tripRequest.userId,
          tripperId: effectiveTripperId ?? null,
          tripRequestId: tripRequest.id,
          tripType: tripRequest.type,
          rating,
          title: title ?? undefined,
          content,
          destination: tripRequest.actualDestination ?? "",
          isApproved: false,
          isPublic: false,
        },
        select: { id: true },
      });

      await tx.tripRequest.update({
        where: { id: tripRequest.id },
        data: { reviewSubmittedAt: new Date() },
      });

      if (admins.length > 0) {
        const notificationData: Prisma.NotificationCreateManyInput[] =
          admins.map((admin) => ({
            userId: admin.id,
            type: "REVIEW_SUBMITTED" as const,
            audience: "ADMIN" as const,
            isRead: false,
            title: notificationTitle,
            metadata: { reviewId: review.id } as Prisma.InputJsonValue,
          }));
        await tx.notification.createMany({ data: notificationData });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reviews] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
