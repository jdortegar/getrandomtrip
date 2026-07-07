import Section from "@/components/layout/Section";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { prisma } from "@/lib/prisma";
import { computeAdminOverviewStats } from "@/lib/admin/overview";
import { AdminHomeContent } from "./AdminHomeContent";

export default async function AdminHomePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);
  const { stats, pending } = await computeAdminOverviewStats(prisma);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminHomeContent
          copy={dict.adminPages.home}
          locale={locale}
          pending={pending}
          stats={stats}
        />
      </div>
    </Section>
  );
}
