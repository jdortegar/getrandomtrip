import Section from "@/components/layout/Section";
import { AccountSettingsPanel } from "@/components/app/account/AccountSettingsPanel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";

export default async function ClientSettingsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);
  const copy = dict.clientDashboard.settingsProfile;

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <div className="space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
              {copy.eyebrow}
            </p>
            <h1 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
              {copy.heading}
            </h1>
          </div>
          <AccountSettingsPanel role="client" />
        </div>
      </div>
    </Section>
  );
}
