import { requireAdmin } from "@/lib/admin/requireAdmin";
import { renderCampaignPreview } from "@/lib/email-campaigns/campaigns";
import { campaignErrorResponse, internalError } from "../../campaignErrorResponse";

export const dynamic = "force-dynamic";

/** The rendered email as a standalone page, for the editor's preview frame. */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const html = await renderCampaignPreview(params.id);
    return new Response(html, {
      headers: {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
        // Email markup never needs scripts; keep the preview inert.
        "content-security-policy": "sandbox",
      },
    });
  } catch (error) {
    const mapped = campaignErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/campaigns/[id]/preview] GET", error);
    return internalError();
  }
}
