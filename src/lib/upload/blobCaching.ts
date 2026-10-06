import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

/** Upload keys are `{userId}/{feature}/{name}-{timestamp}`, so a path never
 * changes content: safe for shared (CDN) and long-lived browser caching. */
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Strong ETag. Prefers the Blobs etag when exposed; falls back to the key
 * (acceptable because keys are immutable). Hashed so it is always a clean token. */
export function blobEtag(key: string, blobEtagValue?: string): string {
  const hash = createHash("sha1")
    .update(blobEtagValue ?? key)
    .digest("hex");
  return `"${hash}"`;
}

/** True when the request's If-None-Match header matches `etag` (weak compare). */
export function matchesIfNoneMatch(
  header: string | null,
  etag: string,
): boolean {
  if (!header) return false;
  if (header.trim() === "*") return true;
  const strip = (v: string) => v.trim().replace(/^W\//, "");
  return header.split(",").some((candidate) => strip(candidate) === etag);
}

/** Builds a 304 (no body) or 200 blob response with the given Cache-Control. */
export function blobResponse(opts: {
  data: BodyInit;
  contentType: string;
  etag: string;
  cacheControl: string;
  ifNoneMatch: string | null;
}): NextResponse {
  const headers = {
    "Cache-Control": opts.cacheControl,
    ETag: opts.etag,
  };
  if (matchesIfNoneMatch(opts.ifNoneMatch, opts.etag)) {
    return new NextResponse(null, { status: 304, headers });
  }
  return new NextResponse(opts.data, {
    headers: {
      ...headers,
      "Content-Type": opts.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
