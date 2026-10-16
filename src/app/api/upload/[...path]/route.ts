import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  IMMUTABLE_CACHE_CONTROL,
  blobEtag,
  blobResponse,
} from "@/lib/upload/blobCaching";
import {
  deleteMediaBlob,
  getMediaBlobWithMetadata,
} from "@/lib/upload/mediaStores";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { path } = await params;
  if (!isSafePath(path))
    return new NextResponse("Bad Request", { status: 400 });

  const key = path.join("/");
  const feature = path[1];

  try {
    const result = await getMediaBlobWithMetadata(key, feature);
    if (!result) return new NextResponse("Not Found", { status: 404 });

    const contentType =
      typeof result.metadata.contentType === "string"
        ? result.metadata.contentType
        : "application/octet-stream";

    // The full path (userId/feature/name-timestamp) uniquely identifies the
    // bytes, so a CDN keyed on path alone is safe and the response is immutable.
    return blobResponse({
      data: result.data,
      contentType,
      etag: blobEtag(key, result.etag),
      cacheControl: IMMUTABLE_CACHE_CONTROL,
      ifNoneMatch: request.headers.get("if-none-match"),
    });
  } catch (error) {
    console.error("[upload/path] GET", error);
    return new NextResponse("Blob store unavailable", { status: 503 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { path } = await params;
  if (!isSafePath(path))
    return new NextResponse("Bad Request", { status: 400 });

  const key = path.join("/");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!key.startsWith(`${session.user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteMediaBlob(key, path[1]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[upload/path] DELETE", error);
    return NextResponse.json(
      { error: "Blob storage unavailable" },
      { status: 503 },
    );
  }
}
