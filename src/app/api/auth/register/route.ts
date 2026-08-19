import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isValidPassword } from "@/lib/validation/password";
import { isValidEmail } from "@/lib/validation/email";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import {
  peekAccessInvite,
  consumeAccessInvite,
} from "@/lib/auth/accessInviteTokens";
import { sendVerificationEmail } from "@/lib/email";
import {
  readAttributionSlug,
  resolveReferrerId,
  stampReferral,
} from "@/lib/tripper/attribution-server";
import type { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, inviteToken, referredByTripperSlug } =
      body;

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

    // Optional invite carried through registration: peek (never consume)
    // BEFORE create so the token stays alive until account creation succeeds.
    // Only grant when the invite email matches the registering email exactly.
    // grantAccess covers both kinds (site access only); grantTripper is the
    // TRIPPER-kind subset that additionally elevates the role.
    let roles: UserRole[] | undefined;
    let grantAccess = false;
    let grantTripper = false;
    if (inviteToken && typeof inviteToken === "string") {
      const peek = await peekAccessInvite(inviteToken);
      grantAccess = peek.ok && peek.email === email;
      grantTripper = grantAccess && peek.ok && peek.kind === "TRIPPER";
      roles = grantTripper ? ["TRAVELER", "TRIPPER"] : ["TRAVELER"];
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
        ...(grantAccess ? { siteAccessGrantedAt: new Date() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    console.log("User created successfully:", user);

    if (grantAccess) {
      await consumeAccessInvite(inviteToken);
      await prisma.waitlistEntry.deleteMany({ where: { email } });
    }

    // Referral capture at signup (spec "Referral Capture at Signup",
    // auth-verification delta): `undefined` -> fall back to the anonymous
    // `grt_tripper` cookie; explicit `null` -> "None", never consult the
    // cookie; a string -> the register `<select>`'s submitted slug. Any
    // slug that fails to resolve to an ACTIVE tripper (deactivated/unknown)
    // is silently dropped — the account is still created, just unattributed.
    // `referredByTripperSlug` comes straight off the untyped JSON body — a
    // client sending anything other than `null` or a string (e.g. a number
    // or object) must never reach the Prisma `where: { tripperSlug }` filter
    // below (that would throw a Prisma validation error and 500 an otherwise
    // valid signup). Treat any such malformed value the same as "absent":
    // fall back to the cookie.
    const isValidReferralInput =
      referredByTripperSlug === null ||
      typeof referredByTripperSlug === "string";
    const referralSlug: string | null = isValidReferralInput
      ? referredByTripperSlug
      : await readAttributionSlug();
    const referrerId = referralSlug
      ? await resolveReferrerId(referralSlug)
      : null;
    await stampReferral(user.id, referrerId);

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
