// Simple stub SSR; reemplazar por integración real más adelante
export type SessionUser = {
  name: string; email: string;
  handle?: string; avatar?: string;
  prefs?: { country?: string; bio?: string; verified?: boolean; publicProfile?: boolean };
  socials?: { ig?: string; yt?: string; web?: string };
  metrics?: { bookings?: number; spendUSD?: number; reviews?: number; favs?: number };
};

// TODO: leer cookies/jwt cuando esté la auth real.
// Por ahora, devolver null para anónimo o un mock si se requiere.
export async function getCurrentUserServer(): Promise<SessionUser | null> {
  return null;
}

// TODO: reemplazar por lógica real de roles
export function getUserRole(): string | null {
  return null;
}
