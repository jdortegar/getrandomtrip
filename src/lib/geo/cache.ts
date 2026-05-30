const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  results: T[];
  expiresAt: number;
}

export interface GeoCache<T> {
  get(key: string): T[] | null;
  set(key: string, results: T[]): void;
}

/**
 * Creates a module-scoped in-memory cache with 24h TTL.
 * When called at module top-level, Next.js evaluates it once per server process,
 * making it act as a singleton.
 */
export function createGeoCache<T>(): GeoCache<T> {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key: string): T[] | null {
      const hit = store.get(key);
      if (!hit) return null;
      if (Date.now() > hit.expiresAt) {
        store.delete(key);
        return null;
      }
      return hit.results;
    },

    set(key: string, results: T[]): void {
      store.set(key, { results, expiresAt: Date.now() + TTL_MS });
    },
  };
}
