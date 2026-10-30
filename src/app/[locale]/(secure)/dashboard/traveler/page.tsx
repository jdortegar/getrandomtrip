import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import Section from "@/components/layout/Section";
import { TravelerHomePageClient } from "@/components/app/dashboard/traveler/TravelerHomePageClient";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/traveler");

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
          currencyCopy={dict.currency}
          eyebrow={dict.travelerDashboard.home.eyebrow}
          heading={dict.travelerDashboard.home.heading}
          locale={locale}
          paymentCopy={{
            paymentBack: dict.journey.checkout.paymentBack,
            paymentFailed: dict.journey.checkout.paymentFailed,
            paymentLoadError: dict.journey.checkout.paymentLoadError,
            paymentLoading: dict.journey.checkout.paymentLoading,
            paymentProcessing: dict.journey.checkout.paymentProcessing,
            paymentRetry: dict.journey.checkout.paymentRetry,
            paymentSubmit: dict.journey.checkout.paymentSubmit,
          }}
          roleToast={dict.travelerDashboard.home.roleToast}
        />
      </div>
    </Section>
  );
}
