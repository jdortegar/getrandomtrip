import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { TravelerHomePageClient } from "@/components/app/dashboard/traveler/TravelerHomePageClient";

export default async function TravelerDashboardHomePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <TravelerHomePageClient
          copy={dict.dashboard}
          eyebrow={dict.travelerDashboard.home.eyebrow}
          heading={dict.travelerDashboard.home.heading}
          locale={locale}
          roleToast={dict.travelerDashboard.home.roleToast}
        />
      </div>
    </Section>
  );
}
