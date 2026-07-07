import { redirect } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";

// Redirects the bare /xsed index to the "new drop" form. Also gives the admin
// nav tab a real page to point at while still prefix-matching both
// /xsed/new and /xsed/[id]/edit for active-tab highlighting (see adminNav.ts).
export default async function AdminXsedIndexPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";

  redirect(pathForLocale(locale, "/dashboard/admin/xsed/new"));
}
