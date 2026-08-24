import type { UserProfileAddress } from "@/lib/types/UserProfileAddress";

export interface UserProfileMe {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: UserProfileAddress | null;
  createdAt: string;
  /** ISO date the TRIPPER role was first granted; null for non-trippers. */
  tripperSince: string | null;
  travelerType: string | null;
  interests: string[];
  dislikes: string[];
  /**
   * App-level role tokens (lowercase) derived from Prisma `User.roles`.
   */
  roles: Array<"admin" | "traveler" | "tripper">;
  /**
   * Most privileged app role (lowercase), for simple UI checks.
   */
  role: "admin" | "traveler" | "tripper";
  avatarUrl?: string | null;
  /** Pre-crop original avatar upload, retained for lossless re-crop via the image editor modal. */
  avatarUrlOriginal?: string | null;
}
