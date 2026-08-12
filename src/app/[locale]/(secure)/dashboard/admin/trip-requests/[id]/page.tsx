import Section from "@/components/layout/Section";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { AdminTripFulfillmentPageClient } from "./AdminTripFulfillmentPageClient";

export default async function AdminTripFulfillmentPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminTripFulfillmentPageClient
          countryLabels={dict.common.countries}
          dict={dict.adminTripEditModal}
          fulfillmentDict={dict.adminTripFulfillment}
          locale={locale}
          paymentStatusLabels={dict.dashboard.paymentStatus}
          tripId={params.id}
        />
      </div>
    </Section>
  );
}
