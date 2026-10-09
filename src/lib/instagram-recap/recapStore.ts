import { getStore } from "@netlify/blobs";
import { getBlobStoreName } from "@/lib/deployment";

const STORE = "instagram-recap";
const FOLLOWERS_KEY = "followers";
const KEEP_SNAPSHOTS = 30;

/** Minimal surface used here; lets tests pass an in-memory fake. */
export interface RecapBlobStore {
  get(key: string, options: { type: "json" }): Promise<unknown>;
  setJSON(key: string, value: unknown): Promise<unknown>;
}

export function getRecapStore(): RecapBlobStore {
  return getStore(getBlobStoreName(STORE), {
    consistency: "strong",
    ...(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? {
          siteID: process.env.NETLIFY_SITE_ID,
          token: process.env.NETLIFY_AUTH_TOKEN,
        }
      : {}),
  });
}

/**
 * Stores today's follower count and returns the latest earlier snapshot.
 * Snapshots are keyed by local `YYYY-MM-DD`.
 */
export async function recordFollowers(
  store: RecapBlobStore,
  today: string,
  followers: number,
): Promise<{ date: string; followers: number } | null> {
  const raw = await store
    .get(FOLLOWERS_KEY, { type: "json" })
    .catch(() => null);
  const snapshots: Record<string, number> =
    raw && typeof raw === "object"
      ? { ...(raw as Record<string, number>) }
      : {};
  const earlier = Object.keys(snapshots)
    .filter((d) => d < today && typeof snapshots[d] === "number")
    .sort();
  const last = earlier.at(-1);
  snapshots[today] = followers;
  const kept = Object.fromEntries(
    Object.entries(snapshots)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-KEEP_SNAPSHOTS),
  );
  await store.setJSON(FOLLOWERS_KEY, kept).catch(() => {
    console.error("[instagram-recap] follower snapshot not saved");
  });
  return last ? { date: last, followers: snapshots[last] } : null;
}
