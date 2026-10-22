import { NextResponse } from "next/server";
import { DESIGN_SYSTEM_LLMS } from "@/lib/constants/DESIGN_SYSTEM_LLMS";

export function GET() {
  return new NextResponse(DESIGN_SYSTEM_LLMS, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
