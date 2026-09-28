import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runSaleNotificationBatch } from "@/lib/db/runSaleNotificationBatch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 25;
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
    return NextResponse.json(await runSaleNotificationBatch(), { headers });
  } catch {
    console.error("[sales] notification batch unavailable");
    return NextResponse.json(
      { error: "sales_unavailable" },
      { status: 503, headers },
    );
  }
}
