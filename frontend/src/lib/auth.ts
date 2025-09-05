export type UserRole = 'tripper' | 'client' | 'admin' | null;

export function getUserRole(): UserRole {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem('role');
    if (v === 'tripper' || v === 'client' || v === 'admin') return v;
    return null;
  } catch {
    return null;
  }
}
