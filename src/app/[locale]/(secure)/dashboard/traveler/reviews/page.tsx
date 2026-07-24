import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { TravelerReviewsPageClient } from "@/components/app/dashboard/traveler/TravelerReviewsPageClient";

export default async function TravelerReviewsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <TravelerReviewsPageClient
          copy={dict.travelerDashboard.reviews}
          locale={locale}
        />
      </div>
    </Section>
  );
}
