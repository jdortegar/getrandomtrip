import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const caller = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });
  return caller && hasRoleAccess(caller, "admin") ? caller : null;
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; benefitId: string }> },
) {
  const { benefitId } = await props.params;
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { url?: string; altText?: string };
    if (!body.url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const maxOrder = await prisma.xsedMedia.aggregate({
      _max: { sortOrder: true },
      where: { componentId: benefitId },
    });

    const photo = await prisma.xsedMedia.create({
      data: {
        componentId: benefitId,
        url: body.url,
        altText: body.altText ?? null,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      select: { id: true, url: true, altText: true, sortOrder: true },
    });

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("[admin/xsed/benefits/photos] POST", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; benefitId: string }> },
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const photoId = new URL(request.url).searchParams.get("photoId");
    if (!photoId) {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 });
    }

    await prisma.xsedMedia.delete({ where: { id: photoId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/xsed/benefits/photos] DELETE", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
