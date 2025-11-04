import { assertTripper } from "@/lib/auth";
import BlogList from "@/components/tripper/blog/BlogList";
import Link from "next/link";
import { demoPosts } from "@/components/tripper/blog/mock";

export default async function TripperBlogListPage() {
  await assertTripper();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-neutral-800">Mis Posts</h1>
        <Link href="/dashboard/tripper/blogs/new" className="rt-btn rt-btn--primary">Crear Nuevo Post</Link>
      </div>
      <BlogList posts={demoPosts} />
    </div>
  );
}