import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function POST() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  if (!Sentry.isEnabled()) {
    return new NextResponse(null, { status: 503 });
  }
  // Uncaught on purpose: exercises instrumentation.ts's onRequestError hook.
  throw new Error("Sentry backend smoke test");
}
