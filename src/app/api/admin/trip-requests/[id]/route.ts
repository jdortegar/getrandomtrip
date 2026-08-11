import { TripRequestStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { attachAdminTripRequestRelations } from "@/lib/admin/trip-requests";
import { toTripDocumentDTO } from "@/lib/trips/tripDocumentDto";
import { prisma } from "@/lib/prisma";
import {
  sendDestinationRevealed,
  sendTripCancelled,
  sendTripCompleted,
} from "@/lib/email";

/**
 * Single fetch for the whole admin fulfillment page. Never status-gated —
 * admins author fulfillment content pre-reveal (design.md, "GET
 * /api/admin/trip-requests/[id]").
 */
export async function GET(
  _request: NextRequest,
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

    const trip = await prisma.tripRequest.findUnique({ where: { id: params.id } });
    if (!trip) {
      return NextResponse.json({ error: "trip_not_found" }, { status: 404 });
    }

    const [exp, payment, tripUser, documents] = await Promise.all([
      trip.experienceId
        ? prisma.experience.findUnique({
            select: {
              excuseKey: true,
              id: true,
              level: true,
              title: true,
              type: true,
              itinerary: true,
              inclusions: true,
              exclusions: true,
            },
            where: { id: trip.experienceId },
          })
        : Promise.resolve(null),
      prisma.payment.findUnique({
        select: { amount: true, currency: true, status: true, tripRequestId: true },
        where: { tripRequestId: trip.id },
      }),
      prisma.user.findUnique({
        select: { email: true, id: true, name: true },
        where: { id: trip.userId },
      }),
      prisma.tripDocument.findMany({
        where: { tripRequestId: trip.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const [hydratedTripRequest] = attachAdminTripRequestRelations(
      [trip],
      tripUser ? { [tripUser.id]: tripUser } : {},
      exp ? { [exp.id]: exp } : {},
      payment
        ? {
            [payment.tripRequestId]: {
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
            },
          }
        : {},
    );

    const experienceItinerary = exp
      ? {
          title: exp.title,
          itinerary: exp.itinerary,
          inclusions: exp.inclusions,
          exclusions: exp.exclusions,
        }
      : null;

    return NextResponse.json({
      tripRequest: hydratedTripRequest,
      experienceItinerary,
      documents: documents.map(toTripDocumentDTO),
    });
  } catch (error) {
    console.error("Error fetching admin trip request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function parseStatus(status: unknown): TripRequestStatus | null {
  if (typeof status !== "string") return null;
  const normalized = status.toUpperCase();
  if (
    Object.values(TripRequestStatus).includes(normalized as TripRequestStatus)
  ) {
    return normalized as TripRequestStatus;
  }
  return null;
}

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, "admin")) {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const nextStatus = parseStatus(body?.status);
    const actualDestination =
      typeof body?.actualDestination === "string"
        ? body.actualDestination.trim()
        : undefined;
    const experienceId =
      typeof body?.experienceId === "string" ? body.experienceId.trim() : undefined;

    if (!nextStatus && actualDestination === undefined && experienceId === undefined) {
      return NextResponse.json(
        {
          error:
            "Nothing to update. Provide status, actualDestination, or experienceId.",
        },
        { status: 400 },
      );
    }

    const data: {
      actualDestination?: string | null;
      completedAt?: Date | null;
      destinationRevealedAt?: Date | null;
      status?: TripRequestStatus;
      experienceId?: string | null;
    } = {};

    if (nextStatus) {
      data.status = nextStatus;
      if (nextStatus === "COMPLETED") {
        data.completedAt = new Date();
      }
      if (nextStatus === "REVEALED") {
        data.destinationRevealedAt = new Date();
      }
    }

    if (actualDestination !== undefined) {
      data.actualDestination = actualDestination || null;
      if (actualDestination && !data.destinationRevealedAt) {
        data.destinationRevealedAt = new Date();
      }
    }

    if (experienceId !== undefined) {
      data.experienceId = experienceId || null;
    }

    // When an experience is assigned, the owner-active guard MUST run
    // BEFORE any write — rejecting an inactive-owner experience after the
    // trip request has already been mutated would leave the write in
    // place despite the rejection. This pre-check also derives
    // actualDestination up front so no second lookup is needed after the
    // write. actualDestination is NOT set directly by the admin — only
    // derived here.
    if (experienceId) {
      const assignedExperience = await prisma.experience.findFirst({
        where: { id: experienceId, owner: { isActive: true } },
        select: { destinationCity: true, destinationCountry: true },
      });

      if (!assignedExperience) {
        return NextResponse.json(
          { error: "Experience not found or its owner is inactive." },
          { status: 400 },
        );
      }

      data.actualDestination = `${assignedExperience.destinationCity}, ${assignedExperience.destinationCountry}`;
    }

    const tripRequest = await prisma.tripRequest.update({
      where: { id: params.id },
      data,
    });

    if (nextStatus === "REVEALED") {
      sendDestinationRevealed(tripRequest.id, tripRequest.userId);
    } else if (nextStatus === "CANCELLED") {
      sendTripCancelled(tripRequest.id, tripRequest.userId);
    } else if (nextStatus === "COMPLETED") {
      // Generate and persist reviewToken before sending email (Scenario 1.1, 1.2, 1.3)
      let reviewToken = tripRequest.reviewToken;
      if (!reviewToken) {
        reviewToken = crypto.randomUUID();
        await prisma.tripRequest.update({
          where: { id: params.id },
          data: { reviewToken },
        });
      }
      sendTripCompleted(tripRequest.id, tripRequest.userId, reviewToken);
    }

    const [exp, payment, tripUser] = await Promise.all([
      tripRequest.experienceId
        ? prisma.experience.findUnique({
            select: {
              excuseKey: true,
              id: true,
              level: true,
              title: true,
              type: true,
            },
            where: { id: tripRequest.experienceId },
          })
        : Promise.resolve(null),
      prisma.payment.findUnique({
        select: {
          amount: true,
          currency: true,
          status: true,
          tripRequestId: true,
        },
        where: { tripRequestId: tripRequest.id },
      }),
      prisma.user.findUnique({
        select: {
          email: true,
          id: true,
          name: true,
        },
        where: { id: tripRequest.userId },
      }),
    ]);

    const [hydratedTripRequest] = attachAdminTripRequestRelations(
      [tripRequest],
      tripUser ? { [tripUser.id]: tripUser } : {},
      exp ? { [exp.id]: exp } : {},
      payment
        ? {
            [payment.tripRequestId]: {
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
            },
          }
        : {},
    );

    return NextResponse.json({ tripRequest: hydratedTripRequest });
  } catch (error) {
    console.error("Error updating admin trip request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    if (!user || !hasRoleAccess(user, "admin")) {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 },
      );
    }

    await prisma.tripRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting admin trip request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
