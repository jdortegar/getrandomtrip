// ============================================================================
// POST /api/admin/experiences/[id]/approve
// Transitions a PENDING_REVIEW experience to ACTIVE, sets pricingByType.
// Auth: admin role only
// ============================================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { validatePricingByType } from "@/lib/admin/experience-pricing";
import { sendMail } from "@/lib/helpers/sendMail";
import ExperienceApproved, { subjects as approvedSubjects } from "@/emails/ExperienceApproved";

export async function POST(
  request: Request,
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
    const experience = await (prisma.experience.findUnique as any)({
      where: { id: params.id },
      select: { id: true, status: true, type: true },
    }) as { id: string; status: string; type: string[] } | null;

    if (!experience) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 },
      );
    }

    if (experience.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        {
          error: "invalid_state",
          message: "Experience must be in PENDING_REVIEW status to approve",
        },
        { status: 409 },
      );
    }

    const body = await request.json() as { pricingByType?: unknown };
    const validation = validatePricingByType(body.pricingByType, experience.type);

    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 422 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.experience.update as any)({
      where: { id: params.id },
      data: {
        status: "ACTIVE",
        isActive: true,
        pricingByType: validation.value,
        reviewNote: null,
      },
    });

    // Fire-and-forget: send approval notification email to the experience owner.
    // This side effect MUST NOT affect the HTTP response — failures are swallowed.
    const ownerId = (updated as { ownerId?: string }).ownerId;
    if (ownerId) {
      void (async () => {
        try {
          const owner = await prisma.user.findUnique({
            where: { id: ownerId },
            select: { email: true, name: true, locale: true },
          });
          if (owner?.email) {
            const locale = owner.locale === "en" ? "en" : "es";
            await sendMail({
              to: owner.email,
              subject: approvedSubjects[locale],
              content: {
                react: (
                  <ExperienceApproved
                    tripper={owner.name ?? ""}
                    experienceTitle={(updated as { title?: string }).title ?? ""}
                    locale={locale}
                  />
                ),
              },
            });
          }
        } catch (err) {
          console.error("[notifications] approve sendMail failed:", err);
        }
      })();
    }

    return NextResponse.json({ experience: updated });
  } catch (error) {
    console.error("[admin/experiences/approve] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
