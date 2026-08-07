import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  addMembershipRole,
  buildUserRoleUpdate,
} from "@/lib/auth/prismaUserRoles";
import { prisma } from "@/lib/prisma";
import {
  generateUniqueTripperSlug,
  getTripperSettingsExtras,
} from "@/lib/db/tripper-queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getTripperSettingsExtras(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching tripper profile:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${detail}` },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bio,
      heroImage,
      heroImagePositionX,
      heroImagePositionY,
      location,
      nickname,
      socialLinks,
      tierLevel,
      destinations,
      tripperSlug: requestedSlug,
      availableTypes,
    } = body;
    // `commission` is deliberately NOT read from the body: it is admin-owned
    // and writable only via PATCH /api/admin/users/[id].

    // Validate required fields for trippers (tripperSlug is optional — we
    // derive one from the user's name below if they didn't provide it).
    // Commission is no longer a client-supplied field, so it is not part of
    // this check — the shared `?? 0.15` default covers a tripper with no
    // assigned rate.
    if (!Array.isArray(availableTypes) || availableTypes.length === 0) {
      return NextResponse.json(
        { error: "availableTypes must be a non-empty array" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      select: { name: true, roles: true },
      where: { id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let tripperSlug: string;
    if (requestedSlug) {
      // Check if tripperSlug is already taken by another user
      const existingTripper = await prisma.user.findFirst({
        where: {
          tripperSlug: requestedSlug,
          id: { not: session.user.id },
        },
      });

      if (existingTripper) {
        return NextResponse.json(
          { error: "Tripper slug already taken" },
          { status: 400 },
        );
      }

      tripperSlug = requestedSlug;
    } else {
      tripperSlug = await generateUniqueTripperSlug(
        existing.name,
        session.user.id,
      );
    }

    const isNewTripper = !existing.roles.includes("TRIPPER");
    const { roles } = buildUserRoleUpdate(
      addMembershipRole(existing.roles, "TRIPPER"),
    );

    // Update user with tripper data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bio,
        heroImage,
        ...(isNewTripper ? { tripperSince: new Date() } : {}),
        heroImagePositionX: typeof heroImagePositionX === "number" ? heroImagePositionX : undefined,
        heroImagePositionY: typeof heroImagePositionY === "number" ? heroImagePositionY : undefined,
        location,
        nickname,
        socialLinks,
        tierLevel,
        destinations,
        tripperSlug,
        availableTypes,
        roles: { set: roles },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        roles: true,
        bio: true,
        heroImage: true,
        heroImagePositionX: true,
        heroImagePositionY: true,
        isActive: true,
        location: true,
        nickname: true,
        socialLinks: true,
        tierLevel: true,
        destinations: true,
        tripperSlug: true,
        commission: true,
        availableTypes: true,
        interests: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: {
        ...updatedUser,
        socialLinks: Array.isArray(updatedUser.socialLinks)
          ? updatedUser.socialLinks
          : [],
      },
    });
  } catch (error) {
    console.error("Error updating tripper profile:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${detail}` },
      { status: 500 },
    );
  }
}
