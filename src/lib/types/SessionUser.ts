import type { Session } from 'next-auth';
import type { TravelerType, User, UserRole } from '@/store/slices/userStore';

export type SessionUser = Session['user'] & {
  avatar?: string | null;
  avatarUrl?: string | null;
  handle?: string | null;
  image?: string | null;
  role?: string;
  roles?: Array<'admin' | 'client' | 'tripper'>;
  travelerType?: string | null;
  interests?: string[];
  dislikes?: string[];
};

function normalizeRoleToken(token: string | undefined): UserRole | undefined {
  if (!token) return undefined;
  const normalized = token.toLowerCase();
  if (normalized === 'client' || normalized === 'tripper' || normalized === 'admin') {
    return normalized;
  }

  const upper = token.toUpperCase();
  if (upper === 'CLIENT') return 'client';
  if (upper === 'TRIPPER') return 'tripper';
  if (upper === 'ADMIN') return 'admin';
  return undefined;
}

function normalizeRoles(roles: SessionUser['roles'], legacyRole: SessionUser['role']): UserRole[] {
  if (Array.isArray(roles) && roles.length > 0) {
    return Array.from(new Set(roles));
  }
  const single = normalizeRoleToken(legacyRole);
  return single ? [single] : [];
}

function normalizeTravelerType(value: string | null | undefined): TravelerType | undefined {
  if (!value) return undefined;
  if (value === 'solo' || value === 'pareja' || value === 'familia' || value === 'amigos' || value === 'empresa') {
    return value;
  }
  return undefined;
}

export function mapSessionUserToStoreUser(sessionUser: SessionUser): User | null {
  if (!sessionUser.id || !sessionUser.name || !sessionUser.email) return null;

  const roles = normalizeRoles(sessionUser.roles, sessionUser.role);
  const role = sessionUser.role
    ? normalizeRoleToken(sessionUser.role)
    : roles.includes('admin')
      ? 'admin'
      : roles.includes('tripper')
        ? 'tripper'
        : roles[0];

  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    role,
    roles: roles.length > 0 ? roles : undefined,
    handle: sessionUser.handle ?? undefined,
    avatar: sessionUser.avatar ?? sessionUser.avatarUrl ?? sessionUser.image ?? undefined,
    prefs: {
      travelerType: normalizeTravelerType(sessionUser.travelerType),
      interests: Array.isArray(sessionUser.interests) ? sessionUser.interests : [],
      dislikes: Array.isArray(sessionUser.dislikes) ? sessionUser.dislikes : [],
    },
  };
}
