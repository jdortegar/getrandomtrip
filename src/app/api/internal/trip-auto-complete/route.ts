import { isProductionDeployment } from "@/lib/deployment";
import { NextResponse } from "next/server";
import { runAutoCompletePass, type AutoCompleteResult } from "./passes";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!isProductionDeployment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let result: AutoCompleteResult = { completed: 0, skipped: 0 };

  try {
    result = await runAutoCompletePass(new Date());
  } catch (err) {
    const msg = `Pass failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[trip-auto-complete] ${msg}`);
    errors.push(msg);
  }

  console.log(
    `[trip-auto-complete] result=${JSON.stringify(result)} errors=${errors.length}`,
  );

  return NextResponse.json({ ...result, errors });
}
