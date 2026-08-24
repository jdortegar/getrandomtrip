import { prisma } from "@/lib/prisma";
import {
  primaryRoleFromMembership,
  prismaUserRoleToAppRole,
  prismaUserRolesToAppRoles,
} from "@/lib/auth/prismaUserRoles";
import type { UserProfileAddress } from "@/lib/types/UserProfileAddress";
import type { UserProfileMe } from "@/lib/types/UserProfileMe";

function toAddress(val: unknown): UserProfileAddress | null {
  if (!val || typeof val !== "object" || Array.isArray(val)) {
    return null;
  }
  const o = val as Record<string, unknown>;
  const street = typeof o.street === "string" ? o.street : "";
  const city = typeof o.city === "string" ? o.city : "";
  const state = typeof o.state === "string" ? o.state : "";
  const zipCode = typeof o.zipCode === "string" ? o.zipCode : "";
  const country = typeof o.country === "string" ? o.country : "";
  const idDocument =
    typeof o.idDocument === "string" && o.idDocument.trim()
      ? o.idDocument.trim()
      : undefined;
  const hasAny = street || city || state || zipCode || country || idDocument;
  if (!hasAny) return null;
  return {
    city,
    country,
    ...(idDocument ? { idDocument } : {}),
    state,
    street,
    zipCode,
  };
}

/**
 * Shared profile-shaping logic behind GET /api/user/me, also used for
 * server-side initial data so client components can hydrate without a
 * loading flash instead of fetching this same data again after mount.
 */
export async function getUserProfileMe(
  email: string,
): Promise<UserProfileMe | null> {
  const u = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      createdAt: true,
      tripperSince: true,
      travelerType: true,
      interests: true,
      dislikes: true,
      roles: true,
      avatarUrl: true,
      avatarUrlOriginal: true,
    },
  });

  if (!u) return null;

  const roles = prismaUserRolesToAppRoles(u.roles);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: toAddress(u.address),
    createdAt: u.createdAt.toISOString(),
    tripperSince: u.tripperSince ? u.tripperSince.toISOString() : null,
    travelerType: u.travelerType,
    interests: u.interests,
    dislikes: u.dislikes,
    role: prismaUserRoleToAppRole(primaryRoleFromMembership(u.roles)),
    roles,
    avatarUrl: u.avatarUrl,
    avatarUrlOriginal: u.avatarUrlOriginal,
  };
}
