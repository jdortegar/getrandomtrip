import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import {
  advanceSourceQueue,
  setSyncBaseline,
} from "@/lib/social-approvals/runSourceCheck";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Body `{ "syncedThrough": "DXiKjIyj3Ik" }` sets the sync starting point: that
 * Spanish post and every earlier one are already on @getrandomtrip.en. Without
 * a body it offers the next Spanish post now, if none is in progress.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });
  if (!caller || !hasRoleAccess(caller, "admin"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Cookie-authenticated mutation: require same-origin browser requests.
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let shortcode: string | undefined;
  try {
    const raw = await request.text();
    const body = raw ? (JSON.parse(raw) as { syncedThrough?: unknown }) : {};
    if (body.syncedThrough !== undefined) {
      if (
        typeof body.syncedThrough !== "string" ||
        !/^[A-Za-z0-9_-]{5,40}$/.test(body.syncedThrough)
      )
        return NextResponse.json(
          { error: "Invalid shortcode" },
          { status: 400 },
        );
      shortcode = body.syncedThrough;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      shortcode ? await setSyncBaseline(shortcode) : await advanceSourceQueue(),
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const known = [
      "SOURCE_UNCONFIGURED",
      "SOURCE_ACCOUNT_MISMATCH",
      "SLACK_DELIVERY_UNCONFIRMED",
      "BASELINE_NOT_FOUND",
    ];
    return NextResponse.json(
      { error: known.includes(code) ? code : "SOURCE_CHECK_FAILED" },
      { status: 503 },
    );
  }
}
