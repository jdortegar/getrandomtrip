import { NextResponse } from "next/server";

import {
  handleResendEvent,
  parseResendEvent,
  verifyResendWebhook,
} from "@/lib/email-campaigns/resendWebhook";

export const dynamic = "force-dynamic";

/**
 * Resend webhook (odd/tasks/email-campaigns.md, decision 7). Unauthenticated;
 * trust comes from the Svix signature over the raw body. Untracked event
 * types, transactional emails and redeliveries are acknowledged with 200;
 * database failures return 500 so Resend retries.
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhooks/resend] RESEND_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  // Must read raw text: re-serialized JSON breaks signature verification.
  const rawBody = await request.text();
  const svixId = request.headers.get("svix-id");
  const verified = verifyResendWebhook(
    rawBody,
    {
      id: svixId,
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    },
    secret,
  );
  if (!verified.ok) {
    console.warn("[webhooks/resend] rejected delivery:", verified.reason);
    return NextResponse.json({ error: verified.reason }, { status: 400 });
  }

  const event = parseResendEvent(verified.payload);
  if (event && svixId) {
    try {
      await handleResendEvent(event, svixId);
    } catch (error) {
      console.error("[webhooks/resend] failed to record event", error);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
