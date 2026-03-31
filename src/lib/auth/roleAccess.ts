export type AppRole = 'admin' | 'client' | 'tripper';

function normalizeRole(role: string | null | undefined): AppRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === 'admin' || normalized === 'client' || normalized === 'tripper') {
    return normalized;
  }
  return null;
}

/**
 * Admin includes client and tripper permissions.
 */
export function hasRoleAccess(
  role: string | null | undefined,
  requiredRole: AppRole,
): boolean {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;
  if (normalizedRole === 'admin') return true;
  return normalizedRole === requiredRole;
}
