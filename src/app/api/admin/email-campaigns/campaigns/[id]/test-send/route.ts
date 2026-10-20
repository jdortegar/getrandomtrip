import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { sendCampaignTest } from "@/lib/email-campaigns/campaigns";
import { campaignErrorResponse, internalError } from "../../campaignErrorResponse";

export const dynamic = "force-dynamic";

/** Sends the rendered campaign to the logged-in admin only. */
export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const { to } = await sendCampaignTest(params.id, auth.adminId);
    return NextResponse.json({ ok: true, to });
  } catch (error) {
    const mapped = campaignErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/campaigns/[id]/test-send] POST", error);
    return internalError();
  }
}
