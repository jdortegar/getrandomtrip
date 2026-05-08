import { redirect } from "next/navigation";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

/** Trip details moved to `/dashboard/trips/[id]`; keep this for bookmarks and external links. */
export default async function LegacyTripDetailsRedirect(props: PageProps) {
  const params = await props.params;
  const locale: Locale = hasLocale(params.locale) ? params.locale : "es";
  redirect(pathForLocale(locale, `/dashboard/trips/${params.id}`));
}
