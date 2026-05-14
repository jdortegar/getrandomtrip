import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
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

function isSafeKey(key: string): boolean {
  if (key.length > 512 || key.length < 8) return false;
  if (key.includes("..") || key.includes("//")) return false;
  // {userId}/{feature}/{uuid}.{ext}
  return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(key);
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !isSafeKey(key)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const feature = key.split("/")[1];

  try {
    const store = getBlobStore(feature);
    let result = await store.getWithMetadata(key, { type: "blob" });

    // Blobs uploaded before the feature-store split all lived in user-media.
    // Fall back to the legacy store so old URLs keep working.
    if (!result && feature !== DEFAULT_STORE) {
      const legacyStore = getBlobStore(undefined);
      result = await legacyStore.getWithMetadata(key, { type: "blob" });
    }

    if (!result) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const contentType =
      typeof result.metadata.contentType === "string"
        ? result.metadata.contentType
        : "application/octet-stream";

    return new NextResponse(result.data, {
      headers: {
        // private: the browser may cache, but the CDN must not.
        // "public" was allowing Netlify's CDN to cache responses keyed only by path,
        // causing different users' images to be served from the same CDN cache entry.
        "Cache-Control": "private, max-age=86400",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[upload] GET", error);
    return new NextResponse("Blob store unavailable", { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !isSafeKey(key)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ownership check: key must start with the requesting user's id
    if (!key.startsWith(`${session.user.id}/`)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const store = getBlobStore(key.split("/")[1]);
    await store.delete(key);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[upload] DELETE", error);
    return NextResponse.json({ error: "Blob storage unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const rawFeature = formData.get("feature");
    if (typeof rawFeature !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawFeature)) {
      return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
    }

    const rawExt = file.name.split(".").pop() ?? "bin";
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin";
    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
    const filename = `${baseName}-${Date.now()}.${ext}`;
    const key = `${session.user.id}/${rawFeature}/${filename}`;

    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const ALLOWED_MIME_TYPES = new Set([
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/avif",
    ]);

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || "application/octet-stream";

    const store = getBlobStore(rawFeature);
    await store.set(key, arrayBuffer, { metadata: { contentType } });

    const url = `/api/upload/${session.user.id}/${rawFeature}/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] POST", error);
    return NextResponse.json({ error: "Blob storage unavailable" }, { status: 503 });
  }
}
