import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/auth/verificationTokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, reason: "missing" },
        { status: 400 },
      );
    }

    const result = await consumeVerificationToken(token, "EMAIL_VERIFY");

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: result.userId },
      data: { emailVerified: new Date() },
      select: { email: true },
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { ok: false, reason: "invalid" },
      { status: 400 },
    );
  }
}
