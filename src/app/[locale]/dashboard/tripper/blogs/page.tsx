import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BlogsPageClient } from "@/components/app/dashboard/tripper/BlogsPageClient";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BlogPost } from "@/types/blog";

export default async function BlogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
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
    where: { authorId: session.user.id },
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

  return <BlogsPageClient posts={posts} />;
}
