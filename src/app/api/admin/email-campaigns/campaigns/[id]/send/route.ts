import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { sendCampaign } from "@/lib/email-campaigns/sending";
import { campaignErrorResponse, internalError } from "../../campaignErrorResponse";

export const dynamic = "force-dynamic";

/** Sends (or retries) the campaign to its segment; returns the run summary. */
export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const summary = await sendCampaign(params.id);
    return NextResponse.json(summary);
  } catch (error) {
    const mapped = campaignErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/campaigns/[id]/send] POST", error);
    return internalError();
  }
}
