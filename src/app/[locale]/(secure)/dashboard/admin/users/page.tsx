import Section from "@/components/layout/Section";
import { AdminUsersPageClient } from "../AdminUsersPageClient";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";

export default async function AdminUsersPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);
  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminUsersPageClient copy={dict.adminUsers} />
      </div>
    </Section>
  );
}
