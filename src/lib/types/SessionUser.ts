import type { Session } from 'next-auth';
import type { TravelerType, User, UserRole } from '@/store/slices/userStore';

export type SessionUser = Session['user'] & {
  avatar?: string | null;
  avatarUrl?: string | null;
  handle?: string | null;
  image?: string | null;
  role?: string;
  travelerType?: string | null;
  interests?: string[];
  dislikes?: string[];
};

function normalizeRole(role: string | undefined): UserRole | undefined {
  if (!role) return undefined;
  const normalized = role.toLowerCase();
  if (normalized === 'client' || normalized === 'tripper' || normalized === 'admin') {
    return normalized;
  }
  return undefined;
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

  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    role: normalizeRole(sessionUser.role),
    handle: sessionUser.handle ?? undefined,
    avatar: sessionUser.avatar ?? sessionUser.avatarUrl ?? sessionUser.image ?? undefined,
    prefs: {
      travelerType: normalizeTravelerType(sessionUser.travelerType),
      interests: Array.isArray(sessionUser.interests) ? sessionUser.interests : [],
      dislikes: Array.isArray(sessionUser.dislikes) ? sessionUser.dislikes : [],
    },
  };
}
