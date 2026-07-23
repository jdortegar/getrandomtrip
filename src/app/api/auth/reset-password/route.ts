import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isValidPassword } from "@/lib/validation/password";
import { consumeVerificationToken } from "@/lib/auth/verificationTokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string" || !password) {
      return NextResponse.json(
        { ok: false, reason: "missing" },
        { status: 400 },
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { ok: false, reason: "weak_password" },
        { status: 400 },
      );
    }

    const result = await consumeVerificationToken(token, "PASSWORD_RESET");

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { emailVerified: true },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: result.userId },
      data: {
        password: hashedPassword,
        // Owning the reset link also proves the email — opportunistically
        // verify if the account was still unverified.
        emailVerified: user?.emailVerified ?? new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { ok: false, reason: "invalid" },
      { status: 400 },
    );
  }
}
