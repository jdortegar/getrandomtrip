import { assertTripper } from "@/lib/auth";
import BlogComposer from "@/components/tripper/blog/BlogComposer";

export default async function TripperBlogNewPage() {
  await assertTripper();

  // In a real app, you'd create a new draft post via API here
  const initialPost = { id: "new", title: "", blocks: [] }; // Mock initial post

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">Crear Nuevo Post</h1>
      <BlogComposer post={initialPost} mode="create" />
    </div>
  );
}
