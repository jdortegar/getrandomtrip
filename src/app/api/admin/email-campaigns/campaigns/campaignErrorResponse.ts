import { NextResponse } from "next/server";

import {
  CAMPAIGN_ERROR_STATUS,
  CampaignError,
} from "@/lib/email-campaigns/campaigns";

/** Maps repository failures to the admin API error shape; `null` otherwise. */
export function campaignErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof CampaignError)) return null;
  return NextResponse.json(
    { error: error.code === "not_found" ? "Not found" : error.code },
    { status: CAMPAIGN_ERROR_STATUS[error.code] },
  );
}

export const internalError = () =>
  NextResponse.json({ error: "Internal server error" }, { status: 500 });
