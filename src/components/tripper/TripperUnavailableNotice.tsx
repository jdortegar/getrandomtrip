import Link from "next/link";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface TripperUnavailableNoticeProps {
  copy: MarketingDictionary["trippers"]["unavailable"];
  ctaHref: string;
  /** Interpolated into `copy.description`'s "{name}" placeholder when known. */
  tripperName?: string;
}

/**
 * Shared "tripper unavailable" state, rendered identically by the server
 * profile page and the client journey flow when a Tripper has isActive:
 * false. Deliberately has no "use client" directive and no hooks — props
 * only — so both surfaces can render the exact same markup.
 */
export function TripperUnavailableNotice({
  copy,
  ctaHref,
  tripperName,
}: TripperUnavailableNoticeProps) {
  const description = tripperName
    ? copy.description.replace("{name}", tripperName)
    : copy.description.replace("{name} ", "").replace("{name}", "");

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-white px-6 py-24 text-center">
      <h1 className="font-barlow-condensed text-4xl font-extrabold uppercase text-gray-900">
        {copy.title}
      </h1>
      <p className="max-w-md text-base text-gray-500">{description}</p>
      <Link
        className="rounded-full bg-light-blue px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        href={ctaHref}
      >
        {copy.ctaLabel}
      </Link>
    </main>
  );
}
