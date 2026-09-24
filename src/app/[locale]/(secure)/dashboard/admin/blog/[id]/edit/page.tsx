import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { mapBlogPostToDraft } from "@/lib/helpers/blog-form";
import { NewBlogPostShell } from "@/components/app/dashboard/tripper/blog/NewBlogPostShell";
import type { BlogPost } from "@/types/blog";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/admin/blog/x/edit");

export default async function AdminEditBlogPostPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const params = await props.params;
  const locale = hasLocale(params.locale) ? params.locale : "es";
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, roles: true },
  });

  if (!user || !hasRoleAccess(user, "admin")) {
    redirect(`/${locale}/dashboard`);
  }

  const post = (await prisma.blogPost.findFirst({
    where: { id: params.id, isReviewCopy: false },
  })) as Partial<BlogPost> | null;

  if (!post?.id) notFound();

  // This flow is RANDOMTRIP-only — admin edits of a tripper's own post stay
  // behind the review pipeline (approve/reject), not this editor. Mirrors
  // /dashboard/admin/experiences/[id]/edit.
  if (post.source !== "RANDOMTRIP") {
    redirect(`/${locale}/dashboard/admin/blog/${params.id}`);
  }

  const dict = await getDictionary(locale);

  return (
    <NewBlogPostShell
      mode="adminCreate"
      dict={dict.tripperBlogs.form}
      finalizeCopy={dict.adminDashboard.newBlogPost}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
      initialDraft={mapBlogPostToDraft(post)}
      initialDraftId={post.id}
      isAdmin
      source={post.source}
    />
  );
}
