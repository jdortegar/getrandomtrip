import { redirect } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";

// Interim redirect: the new admin overview/home content (stats + pending
// actions) lands in a later slice (design.md slice 5). Trip-requests used to
// render directly at this root; now that it has its own route, this page
// forwards to it until the real overview page replaces this redirect.
export default async function AdminHomePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";

  redirect(pathForLocale(locale, "/dashboard/admin/trip-requests"));
}
