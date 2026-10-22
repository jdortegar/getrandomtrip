import { NextResponse } from "next/server";

import { unsubscribeContact } from "@/lib/email-campaigns/contacts";
import { verifyUnsubscribeToken } from "@/lib/email-campaigns/unsubscribeToken";

export const dynamic = "force-dynamic";

/**
 * Public, unauthenticated unsubscribe (odd/tasks/email-campaigns.md,
 * decision 6). Accepts the token from the query string — RFC 8058 one-click
 * POSTs `List-Unsubscribe=One-Click` as a form body to the header URL — or
 * from a JSON `{ token }` body sent by the confirmation page. There is
 * deliberately no GET handler: link scanners must never unsubscribe anyone.
 */
async function readToken(request: Request): Promise<string | null> {
  const fromQuery = new URL(request.url).searchParams.get("token");
  if (fromQuery) return fromQuery;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    const body: unknown = await request.json();
    const token =
      body && typeof body === "object" && "token" in body
        ? (body as { token: unknown }).token
        : null;
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const token = await readToken(request);
  const contactId = token ? verifyUnsubscribeToken(token) : null;
  if (!contactId) {
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 400 },
    );
  }

  try {
    // A deleted contact (`not_found`) has nothing left to unsubscribe, so it
    // reports success like an already-unsubscribed one.
    await unsubscribeContact(contactId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[email/unsubscribe] failed", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
