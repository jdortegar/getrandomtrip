import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { ClientHomePageClient } from "@/components/app/dashboard/client/ClientHomePageClient";

export default async function ClientDashboardHomePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <ClientHomePageClient
          copy={dict.dashboard}
          eyebrow={dict.clientDashboard.home.eyebrow}
          heading={dict.clientDashboard.home.heading}
          locale={locale}
        />
      </div>
    </Section>
  );
}
