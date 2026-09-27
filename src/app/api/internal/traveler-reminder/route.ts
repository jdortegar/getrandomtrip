import { NextResponse } from "next/server";
import { runPass1, runPass2, type Pass1Result, type Pass2Result } from "./passes";

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

    let pass1Result: Pass1Result = { reminded: 0 };
    let pass2Result: Pass2Result = { locked: 0 };

    try {
      pass1Result = await runPass1(now);
    } catch (err) {
      const msg = `Pass 1 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[traveler-reminder] ${msg}`);
      errors.push(msg);
    }

    try {
      pass2Result = await runPass2(now);
    } catch (err) {
      const msg = `Pass 2 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[traveler-reminder] ${msg}`);
      errors.push(msg);
    }

    console.log(
      `[traveler-reminder] pass1=${JSON.stringify(pass1Result)} pass2=${JSON.stringify(pass2Result)} errors=${errors.length}`,
    );

    return NextResponse.json({
      pass1: pass1Result,
      pass2: pass2Result,
      errors,
    });
  } catch (err) {
    console.error("[traveler-reminder] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
