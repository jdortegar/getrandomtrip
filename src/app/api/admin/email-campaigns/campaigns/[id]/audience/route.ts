import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getCampaignAudienceBreakdown } from "@/lib/email-campaigns/sending";
import { campaignErrorResponse, internalError } from "../../campaignErrorResponse";

export const dynamic = "force-dynamic";

/** Recipients the campaign would reach (plus the pre-allowlist total), for the send confirm. */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const audience = await getCampaignAudienceBreakdown(params.id);
    return NextResponse.json(audience);
  } catch (error) {
    const mapped = campaignErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/campaigns/[id]/audience] GET", error);
    return internalError();
  }
}
