// ============================================================================
// Marketing gate – waitlist view on home until "admin" unlock
// ============================================================================

export const GATE_STORAGE_KEY = 'getrandomtrip_marketing_gate';

export function getGateUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(GATE_STORAGE_KEY) === '1';
}
