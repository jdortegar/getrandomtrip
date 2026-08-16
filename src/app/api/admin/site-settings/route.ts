import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getSiteSettings, updateSiteSettings } from "@/lib/siteSettings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  const caller = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });
  if (!caller || !hasRoleAccess(caller, "admin")) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

export async function GET() {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const settings = await getSiteSettings();
    return NextResponse.json({
      gateEnabled: settings.gateEnabled,
      xsedWindowEnforcementEnabled: settings.xsedWindowEnforcementEnabled,
    });
  } catch (error) {
    console.error("[admin/site-settings] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const body = await request.json();
    const patch: { gateEnabled?: boolean; xsedWindowEnforcementEnabled?: boolean } = {};
    if (typeof body?.gateEnabled === "boolean") {
      patch.gateEnabled = body.gateEnabled;
    }
    if (typeof body?.xsedWindowEnforcementEnabled === "boolean") {
      patch.xsedWindowEnforcementEnabled = body.xsedWindowEnforcementEnabled;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const settings = await updateSiteSettings(patch);

    return NextResponse.json({
      gateEnabled: settings.gateEnabled,
      xsedWindowEnforcementEnabled: settings.xsedWindowEnforcementEnabled,
    });
  } catch (error) {
    console.error("[admin/site-settings] PATCH", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
