import Section from "@/components/layout/Section";
import { AdminTripRequestsPageClient } from "../AdminTripRequestsPageClient";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/trip-requests");

export default async function AdminTripRequestsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <AdminTripRequestsPageClient dict={dict.adminTripEditModal} />
      </div>
    </Section>
  );
}
