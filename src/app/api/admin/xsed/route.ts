import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { buildRevealAt } from "@/lib/xsed/revealAt";

export const dynamic = "force-dynamic";

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

// ── GET /api/admin/xsed — list ─────────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const drops = await prisma.experience.findMany({
      where: { type: { has: "XSED" } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        titleInternal: true,
        status: true,
        tripDate: true,
        destinationCity: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ drops });
  } catch (error) {
    console.error("[admin/xsed] GET list", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/admin/xsed — create ─────────────────────────────────────────
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;
    const { adminId } = auth;

    const body = await req.json();

    const {
      teaser,
      titleInternal,
      heroImage,
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
    } = body ?? {};

    // Auto-generate slug as the next drop number
    const dropCount = await prisma.experience.count({ where: { type: { has: "XSED" } } });
    const autoSlug = String(dropCount + 1);

    // Derive title/description from provided fields
    const title = (titleInternal as string | undefined) || (teaser as string | undefined) || "";
    const description = (teaser as string | undefined) || "";

    // Compute revealAt: use supplied value if present, otherwise auto-calc from tripDate
    let revealAtDate: Date | null = null;
    if (revealAtRaw) {
      revealAtDate = new Date(revealAtRaw as string);
    } else if (tripDate) {
      revealAtDate = buildRevealAt(tripDate as string);
    }

    try {
      const drop = await prisma.experience.create({
        data: {
          type: ["XSED"],
          ownerId: adminId,
          createdById: adminId,
          status: "DRAFT",
          title,
          description,
          teaser: (teaser as string | undefined) ?? "",
          heroImage: (heroImage as string | undefined) ?? "",
          destinationCity: (destinationCity as string | undefined) ?? "",
          destinationCountry: (destinationCountry as string | undefined) ?? "",
          slug: autoSlug,
          titleInternal: (titleInternal as string | undefined) || null,
          tripDate: tripDate ? new Date(tripDate as string) : null,
          revealAt: revealAtDate,
          maxSpots: maxSpots != null ? Number(maxSpots) : 10,
          minSpots: minSpots != null ? Number(minSpots) : 2,
          basePrice: basePrice != null ? Number(basePrice) : 250,
          isFeatured: Boolean(isFeatured ?? false),
          preRevealCopy: (preRevealCopy as string | undefined) || null,
          revealCopy: (revealCopy as string | undefined) || null,
          packingHints: (packingHints as string | undefined) || null,
          accessibilityNotes: (accessibilityNotes as string | undefined) || null,
          safetyNotes: (safetyNotes as string | undefined) || null,
          cancellationPolicy: (cancellationPolicy as string | undefined) || null,
          weatherPolicy: (weatherPolicy as string | undefined) || null,
          whatsappMessageTemplate: (whatsappMessageTemplate as string | undefined) || null,
          hotels: safeJsonParse(hotels),
          activities: safeJsonParse(activities),
          adminNotes: (adminNotes as string | undefined) || null,
          supplierNotes: (supplierNotes as string | undefined) || null,
        },
      });

      return NextResponse.json({ id: drop.id }, { status: 201 });
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
    console.error("[admin/xsed] POST", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
