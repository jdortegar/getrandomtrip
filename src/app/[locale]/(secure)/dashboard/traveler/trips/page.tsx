import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { TravelerTripsPageClient } from "@/components/app/dashboard/traveler/TravelerTripsPageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/traveler/trips");

export default async function TravelerTripsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <TravelerTripsPageClient
          copy={dict.dashboard}
          locale={locale}
          pageCopy={dict.travelerDashboard.trips}
        />
      </div>
    </Section>
  );
}
