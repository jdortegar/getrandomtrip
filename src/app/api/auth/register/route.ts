import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isValidPassword } from "@/lib/validation/password";
import { isValidEmail } from "@/lib/validation/email";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import {
  peekTripperInvite,
  consumeTripperInvite,
} from "@/lib/auth/tripperInviteTokens";
import { sendVerificationEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, inviteToken } = body;

    // Validate input. These are stable codes, not display text — clients
    // map them to localized copy (see registerErrorMessage).
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "MISSING_FIELDS" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "INVALID_EMAIL" },
        { status: 400 },
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "WEAK_PASSWORD" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "USER_EXISTS" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Optional Tripper invite carried through registration: peek (never
    // consume) BEFORE create so the token stays alive until account creation
    // succeeds. Only grant when the invite email matches the registering
    // email exactly.
    let roles: UserRole[] | undefined;
    let grantTripper = false;
    if (inviteToken && typeof inviteToken === "string") {
      const peek = await peekTripperInvite(inviteToken);
      grantTripper = peek.ok && peek.email === email;
      roles = grantTripper ? ["CLIENT", "TRIPPER"] : ["CLIENT"];
    }

    // Create user (emailVerified stays null until the verification link is consumed)
    console.log("Creating user:", { name, email });
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        travelerType: null,
        interests: [],
        dislikes: [],
        ...(roles ? { roles } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    console.log("User created successfully:", user);

    if (grantTripper) {
      await consumeTripperInvite(inviteToken);
      await prisma.waitlistEntry.deleteMany({ where: { email } });
    }

    const token = await issueVerificationToken(user.id, "EMAIL_VERIFY");
    sendVerificationEmail(user.id, token); // fire-and-forget

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
