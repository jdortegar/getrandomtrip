import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { getForEditor } from "@/lib/blog/blogRepository";
import { mapEditorPostToDraft } from "@/lib/helpers/blog-form";
import { TripperBlogReviewCopyClient } from "./TripperBlogReviewCopyClient";
import type { BlogPost } from "@/types/blog";
import { dashboardPageMetadata } from "@/lib/dashboard/pageMetadata";

export const generateMetadata = dashboardPageMetadata("/dashboard/tripper/blog/x/review-copy");

export default async function BlogReviewCopyPage(props: {
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

  if (!user || !hasRoleAccess(user, "tripper")) {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch the original blog post (must be owned by the tripper)

  const original = (await (prisma.blogPost.findFirst as any)({
    where: { id: params.id, authorId: user.id, isReviewCopy: false },
  })) as Partial<BlogPost> | null;

  if (!original) notFound();

  // Must be in PENDING_TRIPPER_REVIEW to use this page
  if ((original.status as string) !== "PENDING_TRIPPER_REVIEW") {
    redirect(`/${locale}/dashboard/tripper/blog/${params.id}`);
  }

  // Find the associated (active, non-discarded) review copy

  const copy = (await (prisma.blogPost.findFirst as any)({
    where: { parentId: params.id, isReviewCopy: true, isDiscarded: false },
  })) as (Partial<BlogPost> & { reviewNote: string | null }) | null;

  if (!copy) {
    // No copy found — redirect to normal blog edit page
    redirect(`/${locale}/dashboard/tripper/blog/${params.id}`);
  }

  const [copyEditor, originalEditor] = await Promise.all([
    getForEditor(copy.id as string),
    getForEditor(original.id as string),
  ]);
  if (!copyEditor || !originalEditor) notFound();
  const copyDraft = mapEditorPostToDraft(copyEditor);
  const originalDraft = mapEditorPostToDraft(originalEditor);

  const changedFields: string[] = Array.isArray(copy.changedFields)
    ? copy.changedFields
    : [];

  const dict = await getDictionary(locale);

  return (
    <TripperBlogReviewCopyClient
      dict={dict.tripperBlogs.form}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
      copyDraft={copyDraft}
      originalDraft={originalDraft}
      changedFields={changedFields}
      reviewNote={copy.reviewNote ?? null}
      blogId={params.id}
    />
  );
}
