import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createCampaign, listCampaigns } from "@/lib/email-campaigns/campaigns";
import { createCampaignSchema } from "@/lib/validation/emailCampaigns";
import { campaignErrorResponse, internalError } from "./campaignErrorResponse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    return NextResponse.json({ campaigns: await listCampaigns() });
  } catch (error) {
    console.error("[admin/email-campaigns/campaigns] GET", error);
    return internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const body: unknown = await request.json().catch(() => null);
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const campaign = await createCampaign(parsed.data, auth.adminId);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    const mapped = campaignErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/campaigns] POST", error);
    return internalError();
  }
}
