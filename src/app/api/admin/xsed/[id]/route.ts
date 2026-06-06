import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { buildRevealAt } from "@/lib/xsed/revealAt";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// ── Auth guard ─────────────────────────────────────────────────────────────
type AdminAuthResult =
  | { ok: false; errorResponse: NextResponse }
  | { ok: true; adminId: string };

async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const caller = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });
  if (!caller || !hasRoleAccess(caller, "admin")) {
    return {
      ok: false,
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, adminId: session.user.id };
}

// ── Helpers ────────────────────────────────────────────────────────────────
type NullableJson = Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;

function safeJsonParse(value: unknown): NullableJson {
  if (value === undefined || value === null || value === "") return Prisma.JsonNull;
  if (typeof value !== "string") return value as Prisma.InputJsonValue;
  try {
    return JSON.parse(value) as Prisma.InputJsonValue;
  } catch {
    return Prisma.JsonNull;
  }
}

const DELETABLE_STATUSES = new Set(["DRAFT", "ARCHIVED"]);

// ── GET /api/admin/xsed/[id] ───────────────────────────────────────────────
export async function GET(_req: Request, ctx: RouteContext): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const { id } = await ctx.params;

    const drop = await prisma.experience.findUnique({
      where: { id, type: { has: "XSED" } },
    });

    if (!drop) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ drop });
  } catch (error) {
    console.error("[admin/xsed/[id]] GET", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PUT /api/admin/xsed/[id] ───────────────────────────────────────────────
export async function PUT(req: Request, ctx: RouteContext): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const { id } = await ctx.params;

    // Fetch existing record to validate status gate and check current values
    const existing = await prisma.experience.findUnique({
      where: { id, type: { has: "XSED" } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();

    // Status gate: activating requires destination fields to be non-empty
    const incomingStatus = body.status as string | undefined;
    if (incomingStatus === "ACTIVE") {
      const effectiveCity =
        (body.destinationCity as string | undefined) ?? existing.destinationCity ?? "";
      const effectiveCountry =
        (body.destinationCountry as string | undefined) ?? existing.destinationCountry ?? "";

      if (!effectiveCity.trim() || !effectiveCountry.trim()) {
        return NextResponse.json(
          {
            error: "validation_failed",
            message: "destinationCity and destinationCountry are required to activate a drop",
          },
          { status: 422 },
        );
      }
    }

    // Build update data — never overwrite type or ownerId
    const {
      teaser,
      titleInternal,
      heroImage,
      slug,
      tripDate,
      revealAt: revealAtRaw,
      maxSpots,
      minSpots,
      basePrice,
      isFeatured,
      destinationCity,
      destinationCountry,
      preRevealCopy,
      revealCopy,
      packingHints,
      accessibilityNotes,
      safetyNotes,
      cancellationPolicy,
      weatherPolicy,
      whatsappMessageTemplate,
      hotels,
      activities,
      adminNotes,
      supplierNotes,
      status,
    } = body;

    // Re-derive title/description
    const title =
      (titleInternal as string | undefined) || (teaser as string | undefined)
        ? ((titleInternal as string | undefined) || (teaser as string | undefined) || "")
        : undefined;
    const description =
      teaser !== undefined ? ((teaser as string | undefined) ?? "") : undefined;

    // Compute revealAt
    let revealAtDate: Date | null | undefined;
    if (revealAtRaw !== undefined) {
      revealAtDate = revealAtRaw ? new Date(revealAtRaw as string) : null;
    } else if (tripDate !== undefined) {
      revealAtDate = buildRevealAt(tripDate as string);
    }

    try {
      const updateData: Record<string, unknown> = {};
      if (status !== undefined) updateData.status = status;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (teaser !== undefined) updateData.teaser = teaser ?? "";
      if (heroImage !== undefined) updateData.heroImage = heroImage ?? "";
      if (destinationCity !== undefined) updateData.destinationCity = destinationCity ?? "";
      if (destinationCountry !== undefined) updateData.destinationCountry = destinationCountry ?? "";
      if (slug !== undefined) updateData.slug = (slug as string | undefined) || null;
      if (titleInternal !== undefined) updateData.titleInternal = (titleInternal as string | undefined) || null;
      if (tripDate !== undefined) updateData.tripDate = tripDate ? new Date(tripDate as string) : null;
      if (revealAtDate !== undefined) updateData.revealAt = revealAtDate;
      if (maxSpots !== undefined) updateData.maxSpots = maxSpots != null ? Number(maxSpots) : null;
      if (minSpots !== undefined) updateData.minSpots = minSpots != null ? Number(minSpots) : null;
      if (basePrice !== undefined) updateData.basePrice = basePrice != null ? Number(basePrice) : null;
      if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
      if (preRevealCopy !== undefined) updateData.preRevealCopy = (preRevealCopy as string | undefined) || null;
      if (revealCopy !== undefined) updateData.revealCopy = (revealCopy as string | undefined) || null;
      if (packingHints !== undefined) updateData.packingHints = (packingHints as string | undefined) || null;
      if (accessibilityNotes !== undefined) updateData.accessibilityNotes = (accessibilityNotes as string | undefined) || null;
      if (safetyNotes !== undefined) updateData.safetyNotes = (safetyNotes as string | undefined) || null;
      if (cancellationPolicy !== undefined) updateData.cancellationPolicy = (cancellationPolicy as string | undefined) || null;
      if (weatherPolicy !== undefined) updateData.weatherPolicy = (weatherPolicy as string | undefined) || null;
      if (whatsappMessageTemplate !== undefined) updateData.whatsappMessageTemplate = (whatsappMessageTemplate as string | undefined) || null;
      if (hotels !== undefined) updateData.hotels = safeJsonParse(hotels);
      if (activities !== undefined) updateData.activities = safeJsonParse(activities);
      if (adminNotes !== undefined) updateData.adminNotes = (adminNotes as string | undefined) || null;
      if (supplierNotes !== undefined) updateData.supplierNotes = (supplierNotes as string | undefined) || null;

      const updated = await prisma.experience.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ drop: updated });
    } catch (dbError: unknown) {
      if (
        dbError &&
        typeof dbError === "object" &&
        "code" in dbError &&
        (dbError as { code: string }).code === "P2002"
      ) {
        return NextResponse.json({ error: "slug_conflict" }, { status: 409 });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("[admin/xsed/[id]] PUT", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/admin/xsed/[id] ────────────────────────────────────────────
export async function DELETE(_req: Request, ctx: RouteContext): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const { id } = await ctx.params;

    const existing = await prisma.experience.findUnique({
      where: { id, type: { has: "XSED" } },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!DELETABLE_STATUSES.has(existing.status)) {
      return NextResponse.json(
        {
          error: "deletion_not_allowed",
          message: `Cannot delete a drop with status "${existing.status}". Only DRAFT or ARCHIVED drops can be deleted.`,
        },
        { status: 422 },
      );
    }

    await prisma.experience.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[admin/xsed/[id]] DELETE", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
