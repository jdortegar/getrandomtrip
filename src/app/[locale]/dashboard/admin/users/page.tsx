import { AdminUsersPageClient } from "../AdminUsersPageClient";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";

export default async function AdminUsersPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);
  return <AdminUsersPageClient copy={dict.adminUsers} />;
}
