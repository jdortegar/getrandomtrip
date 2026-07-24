import type { UserRole } from "@prisma/client";
import type { AppRole } from "@/lib/auth/roleAccess";

const PRIMARY_ORDER: UserRole[] = ["ADMIN", "TRIPPER", "TRAVELER"];

function uniqSortedRoles(roles: UserRole[]): UserRole[] {
  return Array.from(new Set(roles)).sort((a, b) => a.localeCompare(b));
}

export function primaryRoleFromMembership(roles: UserRole[]): UserRole {
  for (const candidate of PRIMARY_ORDER) {
    if (roles.includes(candidate)) return candidate;
  }
  return "TRAVELER";
}

/**
 * Every account is a traveler; trippers and admins are additional memberships.
 */
export function ensureTravelerBase(roles: UserRole[]): UserRole[] {
  const withTraveler: UserRole[] = roles.includes("TRAVELER")
    ? roles
    : (["TRAVELER", ...roles] as UserRole[]);
  return uniqSortedRoles(withTraveler);
}

export function addMembershipRole(
  roles: UserRole[],
  added: UserRole,
): UserRole[] {
  return ensureTravelerBase(uniqSortedRoles([...roles, added]));
}

export function parseUserRolesPayload(input: unknown): UserRole[] | null {
  if (!Array.isArray(input)) return null;
  const out: UserRole[] = [];
  for (const v of input) {
    if (v === "TRAVELER" || v === "TRIPPER" || v === "ADMIN") {
      out.push(v);
    } else {
      return null;
    }
  }
  return uniqSortedRoles(out);
}

export function membershipFromLegacyRole(role: UserRole): UserRole[] {
  if (role === "TRIPPER") return ["TRAVELER", "TRIPPER"];
  if (role === "ADMIN") return ["TRAVELER", "ADMIN"];
  return ["TRAVELER"];
}

export function buildUserRoleUpdate(roles: UserRole[]): { roles: UserRole[] } {
  const normalized = ensureTravelerBase(roles);
  return { roles: normalized };
}

export function prismaUserRoleToAppRole(role: UserRole): AppRole {
  if (role === "ADMIN") return "admin";
  if (role === "TRIPPER") return "tripper";
  return "traveler";
}

export function prismaUserRolesToAppRoles(roles: UserRole[]): AppRole[] {
  return Array.from(new Set(roles.map((r) => prismaUserRoleToAppRole(r))));
}
