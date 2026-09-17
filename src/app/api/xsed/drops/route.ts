import { NextResponse } from "next/server";
import { getPublicXsedBlogDropEntries } from "@/lib/data/xsed";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "es";
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const limit = Math.min(
    24,
    Math.max(1, Number(searchParams.get("limit") ?? 6)),
  );

  const result = await getPublicXsedBlogDropEntries(locale, offset, limit);
  return NextResponse.json(result);
}
