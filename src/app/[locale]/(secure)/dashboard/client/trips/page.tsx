import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { ClientTripsPageClient } from "@/components/app/dashboard/client/ClientTripsPageClient";

export default async function ClientTripsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <ClientTripsPageClient
          copy={dict.dashboard}
          locale={locale}
          pageCopy={dict.clientDashboard.trips}
        />
      </div>
    </Section>
  );
}
