import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation/email";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import { sendPasswordResetEmail } from "@/lib/email";

// Always returns the same generic response, regardless of whether the
// submitted email matches an account — enumeration-safe.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (typeof email === "string" && isValidEmail(email)) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, password: true },
      });

      if (user && user.password) {
        const token = await issueVerificationToken(
          user.id,
          "PASSWORD_RESET",
        );
        sendPasswordResetEmail(user.id, token); // fire-and-forget
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return the generic response — never leak internal state.
    return NextResponse.json({ ok: true });
  }
}
