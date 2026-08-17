import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import {
  primaryRoleFromMembership,
  prismaUserRoleToAppRole,
  prismaUserRolesToAppRoles,
} from "@/lib/auth/prismaUserRoles";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import {
  peekAccessInvite,
  consumeAccessInvite,
  resolveOAuthInviteGrant,
  ACCESS_INVITE_COOKIE,
} from "@/lib/auth/accessInviteTokens";
import {
  TRAVELER_INVITE_COOKIE,
  hasLiveTravelerInviteGrant,
} from "@/lib/travelers/travelerInviteTokens";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            roles: true,
            avatarUrl: true,
            travelerType: true,
            interests: true,
            dislikes: true,
            emailVerified: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        if (!user.emailVerified) {
          // Narrow, token-gated exception: a companion holding a LIVE,
          // unconsumed traveler invite may take a session while still
          // unverified, so the `/invite/[token]` wall is not a dead end.
          // The cookie is mintable only by our own `invite-auth-init`
          // route, only after a server-side peek — no other login path
          // ever carries it, so default EMAIL_NOT_VERIFIED behaviour below
          // is otherwise unchanged. Skips the verification-email resend on
          // purpose (see design's "no resend on bypass path" — the
          // register flow already sent one seconds earlier).
          const inviteCookie = (await cookies()).get(
            TRAVELER_INVITE_COOKIE,
          )?.value;
          if (await hasLiveTravelerInviteGrant(inviteCookie)) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.avatarUrl || undefined,
            };
          }

          // Backfilled or never-verified account: fire a fresh verification
          // email and reject with a distinguishable error (not "wrong
          // password") so the client can offer a resend. Token issuance is
          // best-effort here — a DB hiccup on this side must never mask the
          // EMAIL_NOT_VERIFIED signal with an unrelated thrown error.
          try {
            const token = await issueVerificationToken(user.id, "EMAIL_VERIFY");
            sendVerificationEmail(user.id, token); // fire-and-forget
          } catch (err) {
            console.error("Failed to issue verification token on login:", err);
          }
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl || undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Check if user exists in database
      let dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      // For OAuth (Google), create user if doesn't exist
      if (account?.provider === "google" && !dbUser) {
        // Optional Tripper invite carried through OAuth via a short-lived
        // cookie (the `?token=` can't ride the Google redirect as an arg).
        // Peek (never consume) BEFORE create so the token stays alive until
        // account creation succeeds.
        const cookieStore = await cookies();
        const inviteToken = cookieStore.get(ACCESS_INVITE_COOKIE)?.value;
        const invitePeek = inviteToken
          ? await peekAccessInvite(inviteToken)
          : null;
        const grantAccess = resolveOAuthInviteGrant(invitePeek, user.email);
        const grantTripper =
          grantAccess && invitePeek!.ok && invitePeek!.kind === "TRIPPER";

        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || "Usuario",
            avatarUrl: user.image || null,
            locale: "es",
            travelerType: null,
            interests: [],
            dislikes: [],
            emailVerified: new Date(),
            ...(grantAccess ? { siteAccessGrantedAt: new Date() } : {}),
            ...(grantTripper
              ? { roles: ["TRAVELER", "TRIPPER"], tripperSince: new Date() }
              : {}),
          },
        });
        console.log("✅ Created new user from Google OAuth:", dbUser.id);
        sendWelcomeEmail(dbUser.id);

        if (grantAccess && inviteToken) {
          await consumeAccessInvite(inviteToken);
          await prisma.waitlistEntry.deleteMany({
            where: { email: user.email },
          });
        }
      }

      // For credentials, user should already exist (created during registration)
      if (account?.provider === "credentials" && !dbUser) {
        console.error("❌ User not found for credentials login:", user.email);
        return false;
      }

      // Ensure user has the database ID
      if (dbUser) {
        user.id = dbUser.id;

        // Self-service account deactivation is a soft-delete — signing back
        // in (any provider) restores the account exactly as it was.
        if (dbUser.deactivatedAt) {
          await prisma.user.update({
            data: { deactivatedAt: null, isActive: true },
            where: { id: dbUser.id },
          });
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session: clientSession, account }) {
      if (user) {
        token.id = user.id;

        // If signing in with OAuth, ensure we have the DB user ID
        if (account?.provider === "google" && user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
          }
        }
      }

      // Handle session updates from client
      if (trigger === "update" && clientSession) {
        return { ...token, ...clientSession };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        // Fetch latest user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
            address: true,
            phone: true,
            createdAt: true,
            locale: true,
            travelerType: true,
            interests: true,
            dislikes: true,
            avatarUrl: true,
            siteAccessGrantedAt: true,
          },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.hasSiteAccess = !!dbUser.siteAccessGrantedAt;
          session.user.name = dbUser.name;
          session.user.email = dbUser.email;
          session.user.role = prismaUserRoleToAppRole(
            primaryRoleFromMembership(dbUser.roles),
          );
          session.user.roles = prismaUserRolesToAppRoles(dbUser.roles);
          session.user.travelerType = dbUser.travelerType;
          session.user.interests = dbUser.interests;
          session.user.dislikes = dbUser.dislikes;
          session.user.phone = dbUser.phone;
          // Uploaded avatar takes precedence; otherwise keep OAuth image (e.g. Google)
          if (dbUser.avatarUrl) {
            session.user.image = dbUser.avatarUrl;
          }
          session.user.address = dbUser.address as
            | Record<string, string>
            | null
            | undefined;
          session.user.createdAt = dbUser.createdAt.toISOString();
          session.user.locale = dbUser.locale as "es" | "en" | null;
        }
      }
      return session;
    },
  },
};

/**
 * Server-side function to assert user is a tripper
 * Redirects to home if not authenticated or not a tripper
 */
export async function assertTripper() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user || !hasRoleAccess(user, "tripper")) {
    redirect("/");
  }

  return user;
}

/**
 * Client-side function to get user role from local storage or session
 * This is a placeholder - in production, use session data
 */
export function getUserRole(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("user-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.user?.role || null;
    }
  } catch (error) {
    console.error("Error getting user role:", error);
  }

  return null;
}
