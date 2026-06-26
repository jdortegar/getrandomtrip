import { NextResponse } from "next/server";
import { getAllTestimonialsForTripper } from "@/lib/helpers/Tripper";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const testimonials = await getAllTestimonialsForTripper({ id });
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("[tripper/testimonials] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
