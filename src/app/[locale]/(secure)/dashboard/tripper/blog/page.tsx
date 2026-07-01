import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BlogPageClient } from "@/components/app/dashboard/tripper/blog/BlogPageClient";
import Section from "@/components/layout/Section";
import { authOptions } from "@/lib/auth";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { prisma } from "@/lib/prisma";
import type { BlogPost } from "@/types/blog";

export default async function TripperBlogPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  const user = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });

  if (!user || !hasRoleAccess(user, "tripper")) {
    redirect(`/${params.locale}/dashboard`);
  }

  const rawBlogs = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      authorId: true,
      blocks: true,
      coverUrl: true,
      createdAt: true,
      excuseKey: true,
      format: true,
      id: true,
      publishedAt: true,
      slug: true,
      status: true,
      subtitle: true,
      tags: true,
      title: true,
      travelType: true,
      updatedAt: true,
    },
    where: { authorId: user.id },
  });

  const posts: BlogPost[] = rawBlogs.map((blog) => ({
    ...blog,
    blocks: blog.blocks as BlogPost["blocks"],
    coverUrl: blog.coverUrl ?? undefined,
    createdAt: blog.createdAt.toISOString(),
    excuseKey: blog.excuseKey ?? undefined,
    format: blog.format.toLowerCase() as BlogPost["format"],
    publishedAt: blog.publishedAt?.toISOString(),
    slug: blog.slug ?? undefined,
    status: blog.status.toLowerCase() as BlogPost["status"],
    subtitle: blog.subtitle ?? undefined,
    travelType: blog.travelType ?? undefined,
    updatedAt: blog.updatedAt.toISOString(),
  }));

  const locale = params.locale;
  const dict = await getDictionary(locale);

  return (
    <Section>
      <BlogPageClient
        dict={dict.tripperBlogs}
        locale={locale}
        posts={posts}
      />
    </Section>
  );
}
