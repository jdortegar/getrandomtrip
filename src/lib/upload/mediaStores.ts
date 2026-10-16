import { getStore } from "@netlify/blobs";
import {
  DEV_UPLOAD_PREFIX,
  getLegacyMediaStoreName,
  getSharedMediaStoreName,
  isProductionDeployment,
} from "@/lib/deployment";

const FEATURE_STORE: Record<string, string> = {
  avatar: "user-avatars",
  blog: "blog-media",
  experience: "experience-media",
};
const DEFAULT_STORE = "user-media";

/** Strips a trailing `-original` suffix so an original blob resolves to the
 * same store as its baked derivative (e.g. "avatar-original" -> "avatar"). */
function resolveStoreFeature(feature: string): string {
  return feature.endsWith("-original")
    ? feature.slice(0, -"-original".length)
    : feature;
}

function resolveStoreName(feature?: string): string {
  return (feature && FEATURE_STORE[resolveStoreFeature(feature)]) ?? DEFAULT_STORE;
}

function openStore(name: string) {
  return getStore(name, {
    consistency: "strong",
    ...(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? {
          siteID: process.env.NETLIFY_SITE_ID,
          token: process.env.NETLIFY_AUTH_TOKEN,
        }
      : {}),
  });
}

/** Shared store first, then the legacy non-production store (if any). */
function storeNamesFor(storeName: string): string[] {
  const legacy = getLegacyMediaStoreName(storeName);
  return [getSharedMediaStoreName(storeName), ...(legacy ? [legacy] : [])];
}

/** Store every new upload for `feature` is written to. */
export function getMediaWriteStore(feature?: string) {
  return openStore(getSharedMediaStoreName(resolveStoreName(feature)));
}

/** Looks a key up in the feature store, its legacy twin, then the default
 * store (blobs uploaded before the feature-store split lived there). */
export async function getMediaBlobWithMetadata(key: string, feature?: string) {
  const storeName = resolveStoreName(feature);
  const names = [
    ...storeNamesFor(storeName),
    ...(storeName === DEFAULT_STORE ? [] : storeNamesFor(DEFAULT_STORE)),
  ];
  for (const name of names) {
    const result = await openStore(name).getWithMetadata(key, { type: "blob" });
    if (result) return result;
  }
  return null;
}

/** Reads a retained original from the feature store or its legacy twin. */
export async function getMediaArrayBuffer(key: string, feature?: string) {
  for (const name of storeNamesFor(resolveStoreName(feature))) {
    const data = await openStore(name).get(key, { type: "arrayBuffer" });
    if (data) return data;
  }
  return null;
}

/** Deletes a key from the feature store and its legacy twin. The shared store
 * is production's, so non-production may only delete its own `dev-` uploads
 * there — never a production blob that happens to share a user id. */
export async function deleteMediaBlob(key: string, feature?: string) {
  const storeName = resolveStoreName(feature);
  const filename = key.split("/").pop() ?? "";
  if (isProductionDeployment() || filename.startsWith(DEV_UPLOAD_PREFIX)) {
    await openStore(getSharedMediaStoreName(storeName)).delete(key);
  }
  const legacy = getLegacyMediaStoreName(storeName);
  if (legacy) await openStore(legacy).delete(key);
}
