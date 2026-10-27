import { isProductionDeployment } from "@/lib/deployment";
import { NextResponse } from "next/server";
import {
  runDeadlinePass,
  runReinvitePass,
  type DeadlinePassResult,
  type ReinvitePassResult,
} from "./passes";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

/** Hourly: confirms INDIVIDUAL trips past their deadline and re-sends missed invites. */
export async function POST(request: Request) {
  if (!isProductionDeployment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const errors: string[] = [];

    let deadline: DeadlinePassResult = { confirmed: 0, skipped: 0, failed: 0 };
    try {
      deadline = await runDeadlinePass(now);
    } catch (err) {
      const msg = `Deadline pass failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[split-deadline] ${msg}`);
      errors.push(msg);
    }

    let reinvite: ReinvitePassResult = { trips: 0 };
    try {
      reinvite = await runReinvitePass(now);
    } catch (err) {
      const msg = `Reinvite pass failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[split-deadline] ${msg}`);
      errors.push(msg);
    }

    console.log(
      `[split-deadline] deadline=${JSON.stringify(deadline)} reinvite=${JSON.stringify(reinvite)} errors=${errors.length}`,
    );

    return NextResponse.json({ deadline, reinvite, errors });
  } catch (err) {
    console.error("[split-deadline] Unhandled error:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}
