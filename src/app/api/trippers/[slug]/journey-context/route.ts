import { NextRequest, NextResponse } from "next/server";
import { getTripperJourneyContext } from "@/lib/db/tripper-queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;

  // `getTripperJourneyContext` re-throws unexpected DB errors instead of
  // swallowing them into `{ status: "not_found" }` (review finding #7 — that
  // swallowing used to get memoized by `cache()` for the rest of the
  // request). A transient DB error here is a real 500, not "tripper doesn't
  // exist" — surfacing it as 404 would tell a legitimate referral link that
  // the tripper is gone.
  let result;
  try {
    result = await getTripperJourneyContext(slug);
  } catch (error) {
    console.error("GET /api/trippers/[slug]/journey-context threw", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

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
