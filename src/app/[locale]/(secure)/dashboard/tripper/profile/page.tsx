import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TripperProfileEditorShell } from "@/components/app/dashboard/tripper/profile-editor/TripperProfileEditorShell";
import { authOptions } from "@/lib/auth";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";
import { getTripperPublishedBlogs, getTripperSettingsExtras } from "@/lib/db/tripper-queries";
import { tripperProfileDraftFromExtras } from "@/lib/helpers/tripperProfileDraftFromExtras";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { prisma } from "@/lib/prisma";
import type { TripperProfileStoryOption } from "@/types/tripper";

export const generateMetadata = dashboardPageMetadata("/dashboard/tripper/profile");

/** Upper bound of published posts offered in the story picker. */
const STORY_OPTIONS_LIMIT = 60;

export default async function TripperProfileEditorPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect(pathForLocale(locale, "/login"));

  const [dict, extras, user, blogs] = await Promise.all([
    getDictionary(locale),
    getTripperSettingsExtras(userId),
    prisma.user.findUnique({ select: { avatarUrl: true, name: true }, where: { id: userId } }),
    getTripperPublishedBlogs(userId, STORY_OPTIONS_LIMIT, locale),
  ]);

  const initialDraft = tripperProfileDraftFromExtras({
    avatarUrl: user?.avatarUrl,
    extras,
    name: user?.name,
  });
  const stories: TripperProfileStoryOption[] = blogs.map((blog) => ({
    category: blog.category,
    href: blog.href,
    id: blog.href,
    imageUrl: blog.image,
    title: blog.title,
  }));
  const slug = extras?.tripperSlug;

  return (
    <TripperProfileEditorShell
      blogHref={pathForLocale(locale, "/dashboard/tripper/blog")}
      copy={dict.tripperProfileEditor}
      initialDraft={initialDraft}
      initialStatus="DRAFT"
      locale={locale}
      previewHref={slug ? pathForLocale(locale, `/trippers/${slug}`) : null}
      stories={stories}
    />
  );
}
