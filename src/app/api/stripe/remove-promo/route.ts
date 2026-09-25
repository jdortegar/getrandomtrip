import { NextRequest } from "next/server";
import { checkoutQuoteResponse } from "@/lib/payments/checkout-quote";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest) {
  return checkoutQuoteResponse(request, "remove");
}
