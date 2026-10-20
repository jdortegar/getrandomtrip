import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSegment, listSegments } from "@/lib/email-campaigns/segments";
import { createSegmentSchema } from "@/lib/validation/emailCampaigns";
import { internalError } from "../campaigns/campaignErrorResponse";
import { segmentErrorResponse } from "./segmentErrorResponse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    return NextResponse.json({ segments: await listSegments() });
  } catch (error) {
    console.error("[admin/email-campaigns/segments] GET", error);
    return internalError();
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const body: unknown = await request.json().catch(() => null);
    const parsed = createSegmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const segment = await createSegment(parsed.data);
    return NextResponse.json({ segment }, { status: 201 });
  } catch (error) {
    const mapped = segmentErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/segments] POST", error);
    return internalError();
  }
}
