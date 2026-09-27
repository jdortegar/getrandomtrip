import { NextResponse } from "next/server";
import { runPass1, type Pass1Result } from "./passes";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const errors: string[] = [];

    let pass1Result: Pass1Result = { sent: 0, skipped: 0 };

    try {
      pass1Result = await runPass1(now);
    } catch (err) {
      const msg = `Pass 1 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[trip-start-voucher-email] ${msg}`);
      errors.push(msg);
    }

    console.log(
      `[trip-start-voucher-email] pass1=${JSON.stringify(pass1Result)} errors=${errors.length}`,
    );

    return NextResponse.json({
      pass1: pass1Result,
      errors,
    });
  } catch (err) {
    console.error("[trip-start-voucher-email] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
