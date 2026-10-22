import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  deleteCampaign,
  getCampaign,
  updateCampaign,
} from "@/lib/email-campaigns/campaigns";
import { updateCampaignSchema } from "@/lib/validation/emailCampaigns";
import { campaignErrorResponse, internalError } from "../campaignErrorResponse";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, props: RouteProps) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const campaign = await getCampaign(params.id);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("[admin/email-campaigns/campaigns/[id]] GET", error);
    return internalError();
  }
}

export async function PATCH(request: Request, props: RouteProps) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const body: unknown = await request.json().catch(() => null);
    const parsed = updateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const campaign = await updateCampaign(params.id, parsed.data);
    return NextResponse.json({ campaign });
  } catch (error) {
    const mapped = campaignErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/campaigns/[id]] PATCH", error);
    return internalError();
  }
}

export async function DELETE(_request: Request, props: RouteProps) {
  const params = await props.params;
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    await deleteCampaign(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = campaignErrorResponse(error);
    if (mapped) return mapped;
    console.error("[admin/email-campaigns/campaigns/[id]] DELETE", error);
    return internalError();
  }
}
