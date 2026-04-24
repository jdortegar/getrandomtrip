import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORE_NAME = "user-media";

function getBlobStore() {
  return getStore(STORE_NAME, {
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

  try {
    const store = getBlobStore();
    const result = await store.getWithMetadata(key, { type: "blob" });
    if (!result) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const contentType =
      typeof result.metadata.contentType === "string"
        ? result.metadata.contentType
        : "application/octet-stream";

    return new NextResponse(result.data, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
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

    const store = getBlobStore();
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
    const key = `${session.user.id}/${rawFeature}/${crypto.randomUUID()}.${ext}`;

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

    const store = getBlobStore();
    await store.set(key, arrayBuffer, { metadata: { contentType } });

    const url = `${request.nextUrl.origin}/api/upload?key=${encodeURIComponent(key)}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] POST", error);
    return NextResponse.json({ error: "Blob storage unavailable" }, { status: 503 });
  }
}
