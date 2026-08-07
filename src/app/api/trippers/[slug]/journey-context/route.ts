import { NextRequest, NextResponse } from "next/server";
import { getTripperJourneyContext } from "@/lib/db/tripper-queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;

  const result = await getTripperJourneyContext(slug);

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Tripper not found" }, { status: 404 });
  }
  if (result.status === "inactive") {
    return NextResponse.json(
      { error: "tripper_inactive", name: result.name },
      { status: 410 },
    );
  }

  return NextResponse.json(result.context);
}
