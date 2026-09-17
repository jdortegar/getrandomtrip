import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { NewBlogPostShell } from "@/components/app/dashboard/tripper/blog/NewBlogPostShell";

export default async function NewAdminBlogPostPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const dict = await getDictionary(locale);

  return (
    <NewBlogPostShell
      mode="adminCreate"
      dict={dict.tripperBlogs.form}
      finalizeCopy={dict.adminDashboard.newBlogPost}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
    />
  );
}
