import { NextRequest, NextResponse } from "next/server";
import { getTripperJourneyContext } from "@/lib/db/tripper-queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;

  const context = await getTripperJourneyContext(slug);

  if (!context) {
    return NextResponse.json({ error: "Tripper not found" }, { status: 404 });
  }

  return NextResponse.json(context);
}
