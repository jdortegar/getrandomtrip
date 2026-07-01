import { redirect } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";

export default async function LegacySettingsRedirectPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  redirect(pathForLocale(locale, "/dashboard/client/settings"));
}
