import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";
import { runSourceCheck } from "@/lib/social-approvals/runSourceCheck";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Runs the source check now. Body `{ "shortcode": "DXiYOKaFxwb" }` announces
 * that one post regardless of age, for catching up on older posts.
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
    const body = raw ? (JSON.parse(raw) as { shortcode?: unknown }) : {};
    if (body.shortcode !== undefined) {
      if (
        typeof body.shortcode !== "string" ||
        !/^[A-Za-z0-9_-]{5,40}$/.test(body.shortcode)
      )
        return NextResponse.json(
          { error: "Invalid shortcode" },
          { status: 400 },
        );
      shortcode = body.shortcode;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    return NextResponse.json(await runSourceCheck({ shortcode }));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const known = [
      "SOURCE_UNCONFIGURED",
      "SOURCE_ACCOUNT_MISMATCH",
      "SLACK_DELIVERY_UNCONFIRMED",
    ];
    return NextResponse.json(
      { error: known.includes(code) ? code : "SOURCE_CHECK_FAILED" },
      { status: 503 },
    );
  }
}
