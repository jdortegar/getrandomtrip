// ============================================================================
// GET /api/tripper/experiences/[id] - Get a single experience by ID for tripper
// PATCH /api/tripper/experiences/[id] - Update an experience by ID for tripper
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    const experienceId = params.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const experienceData = await (prisma.experience.findFirst as any)({
      where: {
        id: experienceId,
        ownerId: user.id,
      },
      select: {
        id: true,
        title: true,
        teaser: true,
        description: true,
        type: true,
        level: true,
        status: true,
        destinationCountry: true,
        destinationCity: true,
        minNights: true,
        maxNights: true,
        minPax: true,
        maxPax: true,
        pricingByType: true,
        reviewNote: true,
        heroImage: true,
        tags: true,
        excuseKey: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        hotels: true,
        activities: true,
        itinerary: true,
        inclusions: true,
        exclusions: true,
        accommodationType: true,
        transport: true,
        climate: true,
        maxTravelTime: true,
        departPref: true,
        arrivePref: true,
        // XSED fields
        titleInternal: true,
        slug: true,
        tripDate: true,
        revealAt: true,
        minSpots: true,
        maxSpots: true,
        currency: true,
        cancellationPolicy: true,
        weatherPolicy: true,
        accessibilityNotes: true,
        safetyNotes: true,
        revealCopy: true,
        preRevealCopy: true,
        packingHints: true,
        whatsappMessageTemplate: true,
        adminNotes: true,
        supplierNotes: true,
      },
    });

    if (!experienceData) {
      return NextResponse.json(
        { error: "Experience not found or access denied" },
        { status: 404 },
      );
    }

    return NextResponse.json({ experience: experienceData });
  } catch (error) {
    console.error("Error fetching experience:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
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

    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    const experienceId = params.id;

    const existingExperience = await prisma.experience.findFirst({
      where: {
        id: experienceId,
        ownerId: user.id,
      },
    });

    if (!existingExperience) {
      return NextResponse.json(
        { error: "Experience not found or access denied" },
        { status: 404 },
      );
    }

    // Guard: cannot edit an experience while it's awaiting tripper review
    if ((existingExperience.status as string) === "PENDING_TRIPPER_REVIEW") {
      return NextResponse.json(
        {
          error: "locked_for_review",
          message: "Experience cannot be edited while it is pending tripper review. Approve or reject the proposed changes first.",
        },
        { status: 409 },
      );
    }

    const body = await request.json();
    const {
      type,
      level,
      title,
      teaser,
      description,
      heroImage,
      tags,
      destinationCountry,
      destinationCity,
      excuseKey,
      minNights,
      maxNights,
      minPax,
      maxPax,
      isActive,
      isFeatured,
      // Privileged fields stripped (D2): status, pricingByType, reviewNote, basePrice, displayPrice
      // are NOT accepted from tripper PATCH — changes flow through guarded transition endpoints
      // accept both hotels (admin form) and accommodations (tripper form)
      hotels: hotelsField,
      accommodations,
      activities,
      itinerary,
      inclusions,
      exclusions,
      accommodationType,
      transport,
      climate,
      maxTravelTime,
      departPref,
      arrivePref,
      season,
      // XSED fields
      titleInternal,
      slug,
      tripDate,
      revealAt,
      minSpots,
      maxSpots,
      currency,
      cancellationPolicy,
      weatherPolicy,
      accessibilityNotes,
      safetyNotes,
      revealCopy,
      preRevealCopy,
      packingHints,
      whatsappMessageTemplate,
      adminNotes,
      supplierNotes,
    } = body;

    const hotels = hotelsField ?? accommodations;

    // Revert to DRAFT only if a reviewable content field actually changed.
    // Autosave fires on mount even when nothing changed — we must not penalise no-ops.
    const eq = (a: unknown, b: unknown) =>
      JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

    const incomingType = type !== undefined
      ? (Array.isArray(type) ? type : [type].filter(Boolean))
      : existingExperience.type;

    const contentChanged =
      !eq(incomingType, existingExperience.type) ||
      !eq(level ?? null, existingExperience.level) ||
      !eq(title, existingExperience.title) ||
      !eq(teaser ?? "", existingExperience.teaser) ||
      !eq(description ?? "", existingExperience.description) ||
      !eq(heroImage ?? "", existingExperience.heroImage) ||
      !eq(destinationCountry, existingExperience.destinationCountry) ||
      !eq(destinationCity, existingExperience.destinationCity) ||
      !eq(hotels, existingExperience.hotels) ||
      !eq(activities, existingExperience.activities) ||
      !eq(itinerary, existingExperience.itinerary) ||
      !eq(inclusions, existingExperience.inclusions) ||
      !eq(exclusions, existingExperience.exclusions) ||
      !eq(minNights ?? 1, existingExperience.minNights) ||
      !eq(maxNights ?? 7, existingExperience.maxNights) ||
      !eq(minPax ?? 1, existingExperience.minPax) ||
      !eq(maxPax ?? 8, existingExperience.maxPax) ||
      !eq(transport ?? "any", existingExperience.transport) ||
      !eq(climate ?? "any", existingExperience.climate) ||
      !eq(accommodationType ?? "any", existingExperience.accommodationType);

    const revertToDraft = existingExperience.status === "ACTIVE" && contentChanged;

    const updatedExperience = await prisma.experience.update({
      where: { id: experienceId },
      data: {
        ...(type !== undefined && { type: Array.isArray(type) ? type : [type].filter(Boolean) }),
        level: level ?? null,
        ...(title && { title }),
        teaser: teaser ?? "",
        description: description ?? "",
        heroImage: heroImage ?? "",
        tags: tags ?? [],
        ...(destinationCountry && { destinationCountry }),
        ...(destinationCity && { destinationCity }),
        excuseKey: Array.isArray(excuseKey) ? excuseKey : [],
        minNights: minNights ?? 1,
        maxNights: maxNights ?? 7,
        minPax: minPax ?? 1,
        maxPax: maxPax ?? 8,
        ...(isActive !== undefined && { isActive }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(revertToDraft && { status: "DRAFT", isActive: false }),
        ...(hotels !== undefined && { hotels }),
        ...(activities !== undefined && { activities }),
        ...(itinerary !== undefined && { itinerary }),
        ...(inclusions !== undefined && { inclusions }),
        ...(exclusions !== undefined && { exclusions }),
        accommodationType: accommodationType ?? "any",
        transport: transport ?? "any",
        climate: climate ?? "any",
        maxTravelTime: maxTravelTime ?? "no-limit",
        departPref: departPref ?? "any",
        arrivePref: arrivePref ?? "any",
        season: Array.isArray(season) ? season : [],
        titleInternal: titleInternal || null,
        slug: slug || null,
        tripDate: tripDate ? new Date(tripDate as string) : null,
        revealAt: revealAt ? new Date(revealAt as string) : null,
        minSpots: minSpots != null ? Number(minSpots) : null,
        maxSpots: maxSpots != null ? Number(maxSpots) : null,
        currency: (currency as string) || "USD",
        cancellationPolicy: cancellationPolicy || null,
        weatherPolicy: weatherPolicy || null,
        accessibilityNotes: accessibilityNotes || null,
        safetyNotes: safetyNotes || null,
        revealCopy: revealCopy || null,
        preRevealCopy: preRevealCopy || null,
        packingHints: packingHints || null,
        whatsappMessageTemplate: whatsappMessageTemplate || null,
        adminNotes: adminNotes || null,
        supplierNotes: supplierNotes || null,
      },
    });

    return NextResponse.json({ experience: updatedExperience });
  } catch (error) {
    console.error("Error updating experience:", error);
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

    if (!user || !hasRoleAccess(user, "tripper")) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    const existing = await prisma.experience.findFirst({
      where: { id: params.id, ownerId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Experience not found or access denied" },
        { status: 404 },
      );
    }

    await prisma.experience.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting experience:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
