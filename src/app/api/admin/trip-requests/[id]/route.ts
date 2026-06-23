import { TripRequestStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { attachAdminTripRequestRelations } from "@/lib/admin/trip-requests";
import { prisma } from "@/lib/prisma";
import {
  sendDestinationRevealed,
  sendTripCancelled,
  sendTripCompleted,
} from "@/lib/email";

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

    let tripRequest = await prisma.tripRequest.update({
      where: { id: params.id },
      data,
    });

    // When an experience is assigned, derive actualDestination from its city + country.
    // actualDestination is NOT set directly by the admin — only derived here.
    if (experienceId) {
      const assignedExperience = await prisma.experience.findUnique({
        where: { id: experienceId },
        select: { destinationCity: true, destinationCountry: true },
      });

      if (assignedExperience) {
        tripRequest = await prisma.tripRequest.update({
          where: { id: params.id },
          data: {
            actualDestination: `${assignedExperience.destinationCity}, ${assignedExperience.destinationCountry}`,
          },
        });
      }
    }

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
