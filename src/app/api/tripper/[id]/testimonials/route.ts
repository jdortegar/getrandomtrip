import { NextResponse } from "next/server";
import { getAllTestimonialsForTripper } from "@/lib/helpers/Tripper";
import { hasLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rawLocale =
      new URL(request.url).searchParams.get("locale") ?? undefined;
    const locale = hasLocale(rawLocale) ? rawLocale : "es";
    const testimonials = await getAllTestimonialsForTripper({ id }, locale);
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("[tripper/testimonials] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
