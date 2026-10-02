import { isProductionDeployment } from "@/lib/deployment";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readAnalyticsRecapConfig } from "@/lib/analytics-recap/readAnalyticsRecapConfig";
import { runAnalyticsRecap } from "@/lib/analytics-recap/runAnalyticsRecap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 25;
const headers = { "Cache-Control": "private, no-store" };

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
  const config = readAnalyticsRecapConfig();
  if (!config) {
    console.error("[analytics-recap] missing or invalid configuration");
    return NextResponse.json(
      { error: "misconfigured" },
      { status: 500, headers },
    );
  }
  try {
    await runAnalyticsRecap(config);
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    console.error("[analytics-recap] recap unavailable");
    return NextResponse.json(
      { error: "analytics_unavailable" },
      { status: 503, headers },
    );
  }
}
