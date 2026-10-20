import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { deleteSegment, updateSegment } from "@/lib/email-campaigns/segments";
import { updateSegmentSchema } from "@/lib/validation/emailCampaigns";
import { internalError } from "../../campaigns/campaignErrorResponse";
import { segmentErrorResponse } from "../segmentErrorResponse";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, props: RouteProps) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const body: unknown = await request.json().catch(() => null);
    const parsed = updateSegmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const segment = await updateSegment(params.id, parsed.data);
    return NextResponse.json({ segment });
  } catch (error) {
    const mapped = segmentErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/segments/[id]] PATCH", error);
    return internalError();
  }
}

export async function DELETE(_request: Request, props: RouteProps) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    await deleteSegment(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = segmentErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/segments/[id]] DELETE", error);
    return internalError();
  }
}
