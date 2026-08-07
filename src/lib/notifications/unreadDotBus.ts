type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Subscribe to unread-count refresh notifications (mark-read, mark-all-read,
 * bulk delete). Returns an unsubscribe fn suitable for a useEffect cleanup.
 */
export function subscribeUnreadRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify every subscribed listener that the unread count may have changed. */
export function publishUnreadRefresh(): void {
  listeners.forEach((listener) => listener());
}
