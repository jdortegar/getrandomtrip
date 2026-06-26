/**
 * Normalizes an upload URL to a relative path.
 *
 * Old avatars and blog images were stored as absolute production URLs
 * (e.g. https://getrandomtrip.com/api/upload?key=...). Stripping the origin
 * makes them work in any environment without depending on the production domain.
 */
export function normalizeUploadUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/api/upload")) {
      return parsed.pathname + parsed.search;
    }
  } catch {
    // Already a relative URL — nothing to do.
  }
  return url;
}
