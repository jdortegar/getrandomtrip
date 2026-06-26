import { NextResponse } from "next/server";
import { getPublicDropEntries } from "@/lib/data/xsed";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "es";
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const limit = Math.min(
    24,
    Math.max(1, Number(searchParams.get("limit") ?? 6)),
  );

  const excludeId = searchParams.get("excludeId") ?? undefined;
  const result = await getPublicDropEntries(locale, offset, limit, excludeId);
  return NextResponse.json(result);
}
