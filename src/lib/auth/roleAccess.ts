export type AppRole = 'admin' | 'client' | 'tripper';

type RoleSubject =
  | AppRole
  | string
  | null
  | undefined
  | {
      role?: string | null;
      roles?: Array<string | null | undefined> | null;
    };

function normalizeAppRoleToken(token: string | null | undefined): AppRole | null {
  if (!token) return null;
  const normalized = token.toLowerCase();
  if (normalized === 'admin' || normalized === 'client' || normalized === 'tripper') {
    return normalized;
  }

  // Support Prisma enum string values (CLIENT/TRIPPER/ADMIN)
  const upper = token.toUpperCase();
  if (upper === 'ADMIN' || upper === 'CLIENT' || upper === 'TRIPPER') {
    if (upper === 'ADMIN') return 'admin';
    if (upper === 'TRIPPER') return 'tripper';
    return 'client';
  }
  return null;
}

function appRolesFromSubject(subject: RoleSubject): AppRole[] {
  if (!subject) return [];

  if (typeof subject === 'string') {
    const single = normalizeAppRoleToken(subject);
    return single ? [single] : [];
  }

  if (typeof subject === 'object') {
    const fromList = Array.isArray(subject.roles)
      ? subject.roles.map((r) => normalizeAppRoleToken(r ?? undefined)).filter(Boolean)
      : [];

    if (fromList.length > 0) {
      return Array.from(new Set(fromList as AppRole[]));
    }

    const single = normalizeAppRoleToken(subject.role ?? undefined);
    return single ? [single] : [];
  }

  return [];
}

function hasAppRole(roles: AppRole[], requiredRole: AppRole): boolean {
  if (roles.includes('admin')) return true;
  if (requiredRole === 'client') {
    // Client is the base: any logged-in account with a known role is treated as a client
    // (trippers and admins are still clients in this product model).
    return roles.length > 0;
  }
  if (requiredRole === 'tripper') {
    return roles.includes('tripper');
  }
  // admin
  return roles.includes('admin');
}

/**
 * Centralized access checks for both the legacy `role` field and `roles` membership.
 *
 * Rules:
 * - `admin` can access everything.
 * - `tripper` is also a `client` (for `client`-gated areas).
 */
export function hasRoleAccess(subject: RoleSubject, requiredRole: AppRole): boolean {
  return hasAppRole(appRolesFromSubject(subject), requiredRole);
}
