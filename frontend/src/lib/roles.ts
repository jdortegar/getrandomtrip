// frontend/src/lib/roles.ts
export type UserRole = 'client' | 'tripper' | 'admin' | null;

/** A partir del rol, ¿a qué dashboard va el usuario? */
export function dashboardPathFromRole(role: UserRole) {
  if (role === 'tripper') return '/tripper';
  if (role === 'admin') return '/admin'; // placeholder
  return '/dashboard';
}
