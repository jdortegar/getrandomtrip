import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FEATURE_STORE: Record<string, string> = {
  avatar: "user-avatars",
  blog:   "blog-media",
};
const DEFAULT_STORE = "user-media";

function getBlobStore(feature?: string) {
  const storeName = (feature && FEATURE_STORE[feature]) ?? DEFAULT_STORE;
  return getStore(storeName, {
    consistency: "strong",
    ...(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN }
      : {}),
  });
}

function isSafePath(segments: string[]): boolean {
  if (segments.length !== 3) return false;
  const [userId, feature, filename] = segments;
  return (
    /^[a-zA-Z0-9_-]+$/.test(userId) &&
    /^[a-zA-Z0-9_-]+$/.test(feature) &&
    /^[a-zA-Z0-9_.-]+$/.test(filename) &&
    userId.length <= 128 &&
    feature.length <= 64 &&
    filename.length <= 256
  );
}

type Params = { path: string[] };

export async function GET(_: NextRequest, { params }: { params: Promise<Params> }) {
  const { path } = await params;
  if (!isSafePath(path)) return new NextResponse("Bad Request", { status: 400 });

  const key = path.join("/");
  const feature = path[1];

  try {
    const store = getBlobStore(feature);
    const result = await store.getWithMetadata(key, { type: "blob" });
    if (!result) return new NextResponse("Not Found", { status: 404 });

    const contentType =
      typeof result.metadata.contentType === "string"
        ? result.metadata.contentType
        : "application/octet-stream";

    return new NextResponse(result.data, {
      headers: {
        "Cache-Control": "private, max-age=86400",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[upload/path] GET", error);
    return new NextResponse("Blob store unavailable", { status: 503 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<Params> }) {
  const { path } = await params;
  if (!isSafePath(path)) return new NextResponse("Bad Request", { status: 400 });

  const key = path.join("/");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!key.startsWith(`${session.user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const store = getBlobStore(path[1]);
    await store.delete(key);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[upload/path] DELETE", error);
    return NextResponse.json({ error: "Blob storage unavailable" }, { status: 503 });
  }
}
