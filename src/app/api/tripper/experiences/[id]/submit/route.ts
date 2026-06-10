// ============================================================================
// POST /api/tripper/experiences/[id]/submit
// Transitions a DRAFT experience to PENDING_REVIEW.
// Auth: tripper role + ownership
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { getExperienceCompleteness } from "@/lib/helpers/experience-form";
import type { ExperienceFormDraft } from "@/types/tripper";
import { sendExperienceSubmitted } from "@/lib/email";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const experience = await (prisma.experience.findFirst as any)({
      where: { id: params.id, ownerId: user.id },
    }) as (ExperienceFormDraft & {
      id: string; ownerId: string; activities: unknown;
    }) | null;

    if (!experience) {
      return NextResponse.json(
        { error: "Experience not found or access denied" },
        { status: 404 },
      );
    }

    if (experience.status !== "DRAFT") {
      return NextResponse.json(
        { error: "invalid_state", message: "Experience must be in DRAFT status to submit for review" },
        { status: 409 },
      );
    }

    // Map DB row → ExperienceFormDraft shape for completeness check
    const draftForCheck: ExperienceFormDraft = {
      status: experience.status,
      title: experience.title ?? "",
      type: Array.isArray(experience.type) ? experience.type : [],
      level: experience.level ?? "",
      teaser: experience.teaser ?? "",
      description: experience.description ?? "",
      heroImage: experience.heroImage ?? "",
      galleryImages: [],
      tags: [],
      highlights: [],
      destinationCountry: experience.destinationCountry ?? "",
      destinationCity: experience.destinationCity ?? "",
      excuseKey: [],
      climate: "any",
      minPax: 1,
      maxPax: 1,
      minNights: 1,
      maxNights: 1,
      pricingByType: null,
      reviewNote: null,
      estimatedCost: "",
      season: [],
      transport: "any",
      travelTime: "",
      maxTravelTime: "no-limit",
      departPref: "any",
      arrivePref: "any",
      accommodationType: "any",
      accommodations: [],
      activities: Array.isArray(experience.activities)
        ? (experience.activities as ExperienceFormDraft["activities"])
        : [],
      itinerary: [],
      inclusions: [],
      exclusions: [],
      createBlogPost: false,
    };

    const { complete, missing } = getExperienceCompleteness(draftForCheck);
    if (!complete) {
      return NextResponse.json(
        { error: "incomplete", missing },
        { status: 422 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.experience.update as any)({
      where: { id: params.id },
      data: {
        status: "PENDING_REVIEW",
        reviewNote: null,
      },
      select: { id: true, status: true },
    }) as { id: string; status: string };

    sendExperienceSubmitted(updated.id, user.id);

    return NextResponse.json({ experience: updated });
  } catch (error) {
    console.error("[tripper/experiences/submit] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
