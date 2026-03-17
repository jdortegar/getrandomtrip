import type { UserRole as CoreUserRole } from '@/types/core';

/** UserRole with null for unauthenticated / unknown. */
export type UserRole = CoreUserRole | null;

/** A partir del rol, ¿a qué dashboard va el usuario? */
export function dashboardPathFromRole(role: UserRole) {
  if (role === 'tripper') return '/dashboard/tripper';
  if (role === 'admin') return '/admin'; // placeholder
  return '/dashboard';
}
