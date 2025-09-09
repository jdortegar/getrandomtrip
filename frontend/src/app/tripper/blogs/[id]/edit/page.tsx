import { assertTripper } from "@/lib/auth";
import BlogComposer from "@/components/tripper/blog/BlogComposer";
import { notFound } from "next/navigation";

// Mock function to get a post by ID
const getPostById = async (id: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  if (id === "mock-post-1") {
    return { id: "mock-post-1", title: "Mi Primer Post", blocks: [{ type: "paragraph", text: "Este es un post de ejemplo." }] };
  }
  return null;
};

export default async function TripperBlogEditPage({ params }: { params: { id: string } }) {
  await assertTripper();

  const post = await getPostById(params.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">Editar Post: {post.title}</h1>
      <BlogComposer post={post} mode="edit" />
    </div>
  );
}
