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
import { getBasePricePerPerson } from "@/lib/data/traveler-types";

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

    const isAdmin = hasRoleAccess(user, "admin");
    if (!user || (!hasRoleAccess(user, "tripper") && !isAdmin)) {
      return NextResponse.json(
        { error: "Forbidden - Tripper access only" },
        { status: 403 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const experience = await (prisma.experience.findFirst as any)({
      where: { id: params.id },
    }) as (ExperienceFormDraft & {
      id: string; ownerId: string; activities: unknown; source: "TRIPPER" | "RANDOMTRIP";
    }) | null;

    // Owner may always submit their own row. An admin may additionally publish
    // any RANDOMTRIP (admin-owned) row regardless of who created it — never
    // for TRIPPER rows, which stay behind the tripper-review pipeline.
    const isOwner = experience?.ownerId === user.id;
    const isAdminOnRandomtrip = isAdmin && experience?.source === "RANDOMTRIP";

    if (!experience || (!isOwner && !isAdminOnRandomtrip)) {
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
      tags: [],
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

    // RANDOMTRIP (admin-created) rows auto-publish straight to ACTIVE, skipping
    // PENDING_REVIEW; TRIPPER rows keep the existing review pipeline.
    const isRandomtrip = experience.source === "RANDOMTRIP";
    const targetStatus = isRandomtrip ? "ACTIVE" : "PENDING_REVIEW";

    // RANDOMTRIP rows skip admin review (where pricingByType is normally set),
    // so derive it here from the same fixed-config preset the admin review
    // pre-fills — no commission add-on.
    const pricingByType = isRandomtrip
      ? Object.fromEntries(
          (Array.isArray(experience.type) ? experience.type : [])
            .filter((t) => t !== "XSED")
            .map((t) => [t, getBasePricePerPerson(t, experience.level)]),
        )
      : undefined;

    // Guard: a RANDOMTRIP row auto-publishes with no human review step, so it
    // must never go ACTIVE unpriced (e.g. the type selector allows picking
    // "XSED" in the generic wizard, leaving no non-XSED type to derive a price
    // from) or priced at 0 (an unrecognized type/level combo).
    if (
      isRandomtrip &&
      (Object.keys(pricingByType!).length === 0 ||
        Object.values(pricingByType!).some((price) => price <= 0))
    ) {
      return NextResponse.json(
        { error: "unpriceable", message: "No priceable type/level combination selected" },
        { status: 422 },
      );
    }

    // Transition status and clean up any INACTIVE copy from a prior rejection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.$transaction as any)(async (tx: any) => {
      // Delete any INACTIVE review copy for this experience (from a prior rejection cycle)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inactiveCopy = await (tx.experience.findFirst as any)({
        where: {
          parentId: params.id,
          isReviewCopy: true,
          status: "INACTIVE",
        },
        select: { id: true },
      }) as { id: string } | null;

      if (inactiveCopy) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx.experience.delete as any)({ where: { id: inactiveCopy.id } });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (tx.experience.update as any)({
        where: { id: params.id },
        data: {
          status: targetStatus,
          reviewNote: null,
          ...(pricingByType && { pricingByType }),
        },
        select: { id: true, status: true, pricingByType: true },
      });
    }) as { id: string; status: string; pricingByType: Record<string, number> | null };

    if (targetStatus === "PENDING_REVIEW") {
      sendExperienceSubmitted(updated.id, user.id);
    }

    return NextResponse.json({ experience: updated });
  } catch (error) {
    console.error("[tripper/experiences/submit] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
