import type { AnalyticsAuthSuccess } from "@/lib/types/AnalyticsAuthSuccess";
import "next-auth";

declare module "next-auth" {
  interface Session {
    analyticsAuthSuccess?: AnalyticsAuthSuccess;
    user: {
      id: string;
      address?: Record<string, string> | null;
      avatarUrlOriginal?: string | null;
      createdAt?: string;
      dislikes?: string[];
      email: string;
      /** Derived from `User.emailVerified` on every session read. */
      emailVerified?: boolean;
      hasSiteAccess?: boolean;
      image?: string | null;
      interests?: string[];
      name: string;
      phone?: string | null;
      locale?: "es" | "en" | null;
      role?: "admin" | "traveler" | "tripper";
      roles?: Array<"admin" | "traveler" | "tripper">;
      travelerType?: string | null;
    };
  }

  interface User {
    analyticsAuthSuccess?: AnalyticsAuthSuccess;
    id: string;
    email: string;
    name: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    analyticsAuthSuccess?: AnalyticsAuthSuccess;
    id: string;
    /**
     * Referring tripper's slug (design ADR-5), re-derived server-side in the
     * `jwt()` callback on every sign-in — NEVER trust a client-supplied value
     * for this claim (design ADR-6). `undefined` = pre-deploy token (leave
     * the anonymous cookie alone); explicit `null` = confirmed no referrer
     * (force-clear the cookie).
     */
    referredByTripperSlug?: string | null;
  }
}
