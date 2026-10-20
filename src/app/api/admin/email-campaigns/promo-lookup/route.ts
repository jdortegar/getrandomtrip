import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { lookupPromotionCode } from "@/lib/email-campaigns/promo";
import { promoLookupQuerySchema } from "@/lib/validation/emailCampaigns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.errorResponse;

    const parsed = promoLookupQuerySchema.safeParse({
      code: request.nextUrl.searchParams.get("code"),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const promo = await lookupPromotionCode(parsed.data.code);
    if (!promo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ promo });
  } catch (error) {
    console.error("[admin/email-campaigns/promo-lookup] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
