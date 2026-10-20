import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getCampaignReport } from "@/lib/email-campaigns/metrics";
import { internalError } from "../../campaignErrorResponse";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, props: RouteProps) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const report = await getCampaignReport(params.id);
    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(report);
  } catch (error) {
    console.error("[admin/email-campaigns/campaigns/[id]/metrics] GET", error);
    return internalError();
  }
}
