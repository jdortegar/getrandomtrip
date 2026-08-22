import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      address?: Record<string, string> | null;
      createdAt?: string;
      dislikes?: string[];
      email: string;
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
    id: string;
    email: string;
    name: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
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
