import { isProductionDeployment } from "@/lib/deployment";
import { type NextRequest, NextResponse } from "next/server";
import { runPass2, type Pass2Result } from "./passes";
import {
  runAssignmentReminders,
  type AssignmentReminderResult,
} from "./assignmentReminders";

export const dynamic = "force-dynamic";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isProductionDeployment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const errors: string[] = [];

    let pass1Result: AssignmentReminderResult = {
      queued: 0,
      accepted: 0,
      failed: 0,
      skipped: 0,
    };
    let pass2Result: Pass2Result = { revealed: 0, notified: 0, notifyFailed: 0 };

    // Reveal is independent of the email provider and runs before awaited mail work.
    try {
      pass2Result = await runPass2(now);
    } catch (err) {
      const msg = `Pass 2 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[destination-reveal] ${msg}`);
      errors.push(msg);
    }

    try {
      pass1Result = await runAssignmentReminders();
    } catch (err) {
      const msg = `Pass 1 failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[destination-reveal] ${msg}`);
      errors.push(msg);
    }

    console.log(
      `[destination-reveal] pass1=${JSON.stringify(pass1Result)} pass2=${JSON.stringify(pass2Result)} errors=${errors.length}`,
    );

    return NextResponse.json({
      pass1: pass1Result,
      pass2: pass2Result,
      errors,
    });
  } catch (err) {
    console.error("[destination-reveal] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
