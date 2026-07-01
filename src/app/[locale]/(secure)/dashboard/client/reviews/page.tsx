import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { ClientReviewsPageClient } from "@/components/app/dashboard/client/ClientReviewsPageClient";

export default async function ClientReviewsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <ClientReviewsPageClient
          copy={dict.clientDashboard.reviews}
          locale={locale}
        />
      </div>
    </Section>
  );
}
