import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Lookup TripRequest by reviewToken
    const tripRequest = await prisma.tripRequest.findUnique({
      where: { reviewToken: token },
      select: {
        id: true,
        userId: true,
        tripperId: true,
        reviewSubmittedAt: true,
        actualDestination: true,
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

    // Transactionally create Review + update TripRequest.reviewSubmittedAt
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          userId: tripRequest.userId,
          tripperId: tripRequest.tripperId ?? null,
          tripRequestId: tripRequest.id,
          rating,
          title: title ?? undefined,
          content,
          destination: tripRequest.actualDestination ?? "",
          isApproved: false,
          isPublic: false,
        },
      });

      await tx.tripRequest.update({
        where: { id: tripRequest.id },
        data: { reviewSubmittedAt: new Date() },
      });
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
