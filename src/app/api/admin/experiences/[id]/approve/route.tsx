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
import { overwriteOriginalWithCopy } from "@/lib/experiences/changed-fields";
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

    // Check whether a non-INACTIVE review copy exists for this experience.
    // If yes → perform the atomic copy→original overwrite, then set ACTIVE.
    // If no  → follow the existing direct-approve path.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingCopy = await (prisma.experience.findFirst as any)({
      where: {
        parentId: params.id,
        isReviewCopy: true,
        NOT: { status: "INACTIVE" },
      },
      select: { id: true },
    }) as { id: string } | null;

    let updated: unknown;

    if (existingCopy) {
      // Copy-based approve: overwrite + delete copy in transaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updated = await (prisma.$transaction as any)(async (tx: any) => {
        const result = await overwriteOriginalWithCopy(tx, params.id, existingCopy.id);
        // overwriteOriginalWithCopy already sets status=ACTIVE, isActive=true
        // Apply the admin-supplied pricingByType on top
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalResult = await (tx.experience.update as any)({
          where: { id: params.id },
          data: { pricingByType: validation.value },
        });
        // Hard-delete the copy
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx.experience.delete as any)({ where: { id: existingCopy.id } });
        return finalResult ?? result;
      });
    } else {
      // Direct approve path (no copy)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updated = await (prisma.experience.update as any)({
        where: { id: params.id },
        data: {
          status: "ACTIVE",
          isActive: true,
          pricingByType: validation.value,
          reviewNote: null,
        },
      });
    }

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

      void (async () => {
        try {
          const owner = await prisma.user.findUnique({
            where: { id: ownerId },
            select: { locale: true },
          });
          const notifLocale = owner?.locale === "en" ? "en" : "es";
          const notifCopy = notifLocale === "en"
            ? { title: "Your experience has been approved!", body: `"${(updated as { title?: string }).title ?? ""}" is now live.` }
            : { title: "¡Tu experiencia fue aprobada!", body: `"${(updated as { title?: string }).title ?? ""}" ya está activa.` };
          await prisma.notification.create({
            data: {
              userId: ownerId,
              type: "EXPERIENCE_APPROVED",
              audience: "TRIPPER",
              isRead: false,
              title: notifCopy.title,
              body: notifCopy.body,
              metadata: { experienceId: (updated as { id: string }).id },
            },
          });
        } catch (err) {
          console.error("[notification] approve emit failed:", err);
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
