import { headers } from "next/headers";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { countryToTimezone } from "@/lib/xsed/country-tz";
import { isLocalWindowOpen } from "@/lib/xsed/window";
import { getCurrentXsedDrop } from "@/lib/data/xsed";
import { XsedUnavailablePage } from "@/components/app/xsed/XsedUnavailablePage";
import { XsedBookClient } from "@/components/app/xsed/XsedBookClient";

type Props = {
  params: Promise<{ locale?: string }>;
};

export default async function XsedBookPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const normalizedLocale = hasLocale(rawLocale) ? rawLocale : "es";
  const dict = await getDictionary(normalizedLocale);

  // ── Server gate ────────────────────────────────────────────────────────────
  // Netlify CDN injects x-country with the ISO alpha-2 country code of the
  // request's IP. We map it to a timezone and check if it's Sunday 4pm–8pm
  // local time. If not, we render the unavailable page — same URL, no redirect,
  // nothing to bypass via URL manipulation.
  const reqHeaders = await headers();
  const country = reqHeaders.get("x-country") ?? "";
  const tz = countryToTimezone(country) ?? "America/Argentina/Buenos_Aires";
  const bypassWindow = process.env.XSED_BYPASS_WINDOW === "true";
  const windowOpen = bypassWindow || isLocalWindowOpen(tz);

  if (!windowOpen) {
    return <XsedUnavailablePage />;
  }

  const currentDrop = await getCurrentXsedDrop();

  return (
    <XsedBookClient
      book={dict.xsedBook}
      detailsStepLabels={dict.journey.detailsStep}
      experienceId={currentDrop?.id}
      locale={normalizedLocale}
      userBadgeLabels={dict.journey.userBadge}
    />
  );
}
