import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORE_NAME = "blog-media";

function isSafeBlobKey(key: string): boolean {
  if (key.length > 512 || key.length < 8) return false;
  if (!key.startsWith("blog/")) return false;
  if (key.includes("..") || key.includes("//")) return false;
  return /^blog\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(key);
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !isSafeBlobKey(key)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  try {
    const store = getStore(STORE_NAME, { consistency: "strong" });
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
      },
    });
  } catch (error) {
    console.error("[blog-media] GET", error);
    return new NextResponse("Blob store unavailable", { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      select: { role: true },
      where: { id: session.user.id },
    });

    if (!user || !hasRoleAccess(user.role, "tripper")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const rawExt = file.name.split(".").pop() ?? "bin";
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin";
    const key = `blog/${session.user.id}/${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || "application/octet-stream";

    const store = getStore(STORE_NAME, { consistency: "strong" });
    await store.set(key, arrayBuffer, {
      metadata: { contentType },
    });

    const location = `${request.nextUrl.origin}/api/tripper/blog-media?key=${encodeURIComponent(key)}`;
    return NextResponse.json({ location });
  } catch (error) {
    console.error("[blog-media] POST", error);
    return NextResponse.json(
      { error: "Blob storage unavailable" },
      { status: 503 },
    );
  }
}
