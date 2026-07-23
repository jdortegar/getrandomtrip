import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import { mapBlogPostToDraft } from "@/lib/helpers/blog-form";
import { AdminBlogReviewClient } from "./AdminBlogReviewClient";
import type { BlogPost } from "@/types/blog";

export default async function AdminBlogReviewPage(props: {
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

  // Admin can review any blog post — no authorId filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post = (await (prisma.blogPost.findFirst as any)({
    where: { id: params.id },
  })) as
    | (Partial<BlogPost> & {
        reviewLockedBy: string | null;
        tripperNote: string | null;
      })
    | null;

  if (!post) notFound();

  // Check for an existing active review copy — load it instead of the
  // original so the admin resumes editing their previous changes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingCopy = (await (prisma.blogPost.findFirst as any)({
    where: { parentId: params.id, isReviewCopy: true, isDiscarded: false },
  })) as
    | (Partial<BlogPost> & {
        id: string;
        reviewNote: string | null;
      })
    | null;

  // Fetch locker name if locked by another admin
  let reviewLockedByName: string | null = null;
  if (post.reviewLockedBy && post.reviewLockedBy !== user.id) {
    const locker = await prisma.user.findUnique({
      where: { id: post.reviewLockedBy },
      select: { name: true },
    });
    reviewLockedByName = locker?.name ?? null;
  }

  // When a copy exists, load its content so the admin resumes their edits.
  const source = existingCopy ?? post;
  const initialDraft = mapBlogPostToDraft(source);

  const dict = await getDictionary(locale);

  return (
    <AdminBlogReviewClient
      dict={dict.tripperBlogs.form}
      locale={locale}
      userBadgeLabels={dict.journey.userBadge}
      initialDraft={initialDraft}
      blogId={params.id}
      currentAdminId={user.id}
      initialMode={existingCopy ? "adminEdit" : "adminReadOnly"}
      reviewLockedBy={post.reviewLockedBy ?? null}
      reviewLockedByName={reviewLockedByName}
      adminCopyId={existingCopy?.id ?? null}
      tripperNote={source.tripperNote ?? null}
    />
  );
}
