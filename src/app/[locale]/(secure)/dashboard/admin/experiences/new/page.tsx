import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { NewExperienceShell } from "@/components/app/dashboard/tripper/experiences/NewExperienceShell";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/experiences/new");

export default async function NewAdminExperiencePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <NewExperienceShell
      dict={dict.tripperExperiences.form}
      enableCopyTranslation
      finalizeCopy={dict.adminDashboard.newExperience}
      locale={locale}
      mode="adminCreate"
      userBadgeLabels={dict.journey.userBadge}
    />
  );
}
