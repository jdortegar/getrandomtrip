import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDocumentCleanupBatch } from "@/lib/db/runDocumentCleanupBatch";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
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
    const { claimed, swept, failed } = await runDocumentCleanupBatch();
    if (failed)
      console.warn("[document-cleanup] retryable failures", {
        claimed,
        swept,
        failed,
      });
    return NextResponse.json({ claimed, swept, failed }, { headers });
  } catch {
    console.error("[document-cleanup] batch unavailable");
    return NextResponse.json(
      { error: "cleanup_unavailable" },
      { status: 503, headers },
    );
  }
}
