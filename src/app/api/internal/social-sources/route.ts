import { isProductionDeployment } from "@/lib/deployment";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runSourceCheck } from "@/lib/social-approvals/runSourceCheck";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 25;
const headers = { "Cache-Control": "private, no-store" };

/** Daily check for new @getrandomtrip.es posts, called by the scheduled function. */
export async function POST(request: Request) {
  if (!isProductionDeployment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const secret = process.env.CRON_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (
    !secret ||
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers },
    );
  try {
    const result = await runSourceCheck();
    return NextResponse.json({ ok: true, ...result }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    console.error(`[social-sources] check failed: ${code.slice(0, 60)}`);
    return NextResponse.json(
      { error: "source_check_failed" },
      { status: 503, headers },
    );
  }
}
