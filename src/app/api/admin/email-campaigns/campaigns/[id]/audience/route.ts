import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getCampaignAudienceCount } from "@/lib/email-campaigns/sending";
import { campaignErrorResponse, internalError } from "../../campaignErrorResponse";

export const dynamic = "force-dynamic";

/** Subscribed recipients the campaign would reach, for the send confirm. */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const count = await getCampaignAudienceCount(params.id);
    return NextResponse.json({ count });
  } catch (error) {
    const mapped = campaignErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/campaigns/[id]/audience] GET", error);
    return internalError();
  }
}
