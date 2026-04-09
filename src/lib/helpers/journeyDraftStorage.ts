const STORAGE_PREFIX = "journey-draft:";

/** Session key so React Strict Mode double-mount does not assign two draftIds before replace applies. */
const PENDING_DRAFT_ID_SESSION_KEY = "journey-pending-draft-id";

export function journeyDraftLocalStorageKey(draftId: string): string {
  return `${STORAGE_PREFIX}${draftId}`;
}

export function saveJourneyDraftQueryString(
  draftId: string,
  queryString: string,
): void {
  if (typeof window === "undefined" || !draftId) return;
  try {
    localStorage.setItem(journeyDraftLocalStorageKey(draftId), queryString);
  } catch {
    // Quota or private mode
  }
}

export function clearJourneyDraftStorage(draftId: string | null | undefined): void {
  if (typeof window === "undefined" || !draftId) return;
  try {
    localStorage.removeItem(journeyDraftLocalStorageKey(draftId));
  } catch {
    // ignore
  }
}

export function consumePendingJourneyDraftId(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }
  const existing = sessionStorage.getItem(PENDING_DRAFT_ID_SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(PENDING_DRAFT_ID_SESSION_KEY, id);
  return id;
}

export function clearPendingJourneyDraftIdSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_DRAFT_ID_SESSION_KEY);
  } catch {
    // ignore
  }
}
