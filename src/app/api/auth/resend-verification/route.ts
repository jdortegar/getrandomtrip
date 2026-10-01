import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import { safeInviteReturnPath } from "@/lib/auth/inviteReturnPath";
import { deliverVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Minimum gap between two verification emails for the same account. */
const COOLDOWN_MS = 60 * 1000;

/**
 * POST /api/auth/resend-verification — session-gated. Sends a fresh
 * verification link to the SIGNED-IN account only (the target is never taken
 * from the body, so it cannot probe other addresses). Optional body
 * `{ returnPath }` is honoured only when it passes `safeInviteReturnPath`;
 * anything else is ignored and the link returns to login as usual.
 *
 * Codes: 401 unauthenticated, 409 `already_verified`, 429 `cooldown` (one
 * email per 60s, measured from the newest EMAIL_VERIFY token's `createdAt`, so
 * it also spaces out against register/login sends), 502 `send_failed` (the
 * send is awaited; on failure the freshly issued token is deleted so the
 * cooldown does not block an immediate retry), 500 `internal_error`.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, emailVerified: true },
    });
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "already_verified" }, { status: 409 });
    }

    const latest = await prisma.verificationToken.findFirst({
      where: { userId: user.id, type: "EMAIL_VERIFY" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (latest) {
      const remainingMs = latest.createdAt.getTime() + COOLDOWN_MS - Date.now();
      if (remainingMs > 0) {
        const retryAfterSeconds = Math.ceil(remainingMs / 1000);
        return NextResponse.json(
          { error: "cooldown", retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
        );
      }
    }

    const body = await request.json().catch(() => null);
    const returnPath = safeInviteReturnPath(body?.returnPath) ?? undefined;

    const token = await issueVerificationToken(user.id, "EMAIL_VERIFY");
    try {
      await deliverVerificationEmail(user.id, token, returnPath);
    } catch (sendError) {
      console.error("Resend verification send failed:", sendError);
      await prisma.verificationToken.deleteMany({
        where: { userId: user.id, type: "EMAIL_VERIFY", consumedAt: null },
      });
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
