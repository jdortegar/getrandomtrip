import { hasLocale } from "@/lib/i18n/config";
import {
  readAttributionSlug,
  resolveLiveAttribution,
} from "@/lib/tripper/attribution-server";
import ExperiencesPageClient from "./ExperiencesPageClient";

export default async function ExperiencesPage(props: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ catalog?: string }>;
}) {
  const [params, search] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const tripperContext =
    search?.catalog === "randomtrip"
      ? null
      : await resolveLiveAttribution(await readAttributionSlug());
  return (
    <ExperiencesPageClient locale={locale} tripperContext={tripperContext} />
  );
}
