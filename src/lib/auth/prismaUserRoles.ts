import type { UserRole } from '@prisma/client';
import type { AppRole } from '@/lib/auth/roleAccess';

const PRIMARY_ORDER: UserRole[] = ['ADMIN', 'TRIPPER', 'CLIENT'];

function uniqSortedRoles(roles: UserRole[]): UserRole[] {
  return Array.from(new Set(roles)).sort((a, b) => a.localeCompare(b));
}

export function primaryRoleFromMembership(roles: UserRole[]): UserRole {
  for (const candidate of PRIMARY_ORDER) {
    if (roles.includes(candidate)) return candidate;
  }
  return 'CLIENT';
}

/**
 * Every account is a client; trippers and admins are additional memberships.
 */
export function ensureClientBase(roles: UserRole[]): UserRole[] {
  const withClient: UserRole[] = roles.includes('CLIENT')
    ? roles
    : (['CLIENT', ...roles] as UserRole[]);
  return uniqSortedRoles(withClient);
}

export function addMembershipRole(roles: UserRole[], added: UserRole): UserRole[] {
  return ensureClientBase(uniqSortedRoles([...roles, added]));
}

export function parseUserRolesPayload(input: unknown): UserRole[] | null {
  if (!Array.isArray(input)) return null;
  const out: UserRole[] = [];
  for (const v of input) {
    if (v === 'CLIENT' || v === 'TRIPPER' || v === 'ADMIN') {
      out.push(v);
    } else {
      return null;
    }
  }
  return uniqSortedRoles(out);
}

export function membershipFromLegacyRole(role: UserRole): UserRole[] {
  if (role === 'TRIPPER') return ['CLIENT', 'TRIPPER'];
  if (role === 'ADMIN') return ['CLIENT', 'ADMIN'];
  return ['CLIENT'];
}

export function buildUserRoleUpdate(roles: UserRole[]): { roles: UserRole[] } {
  const normalized = ensureClientBase(roles);
  return { roles: normalized };
}

export function prismaUserRoleToAppRole(role: UserRole): AppRole {
  if (role === 'ADMIN') return 'admin';
  if (role === 'TRIPPER') return 'tripper';
  return 'client';
}

export function prismaUserRolesToAppRoles(roles: UserRole[]): AppRole[] {
  return Array.from(new Set(roles.map((r) => prismaUserRoleToAppRole(r))));
}

