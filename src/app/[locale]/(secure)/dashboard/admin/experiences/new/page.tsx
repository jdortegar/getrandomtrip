import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { NewExperienceShell } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";

export default async function NewAdminExperiencePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <NewExperienceShell
      mode="adminCreate"
      dict={dict.tripperExperiences.form}
      finalizeCopy={dict.adminDashboard.newExperience}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
    />
  );
}
