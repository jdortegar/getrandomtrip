import { assertTripper } from "@/lib/auth";
import { notFound } from "next/navigation";

// Mock function to get a post by ID
const getPostById = async (id: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  if (id === "mock-post-1") {
    return { id: "mock-post-1", title: "Mi Primer Post", blocks: [{ type: "paragraph", text: "Este es un post de ejemplo para previsualización." }] };
  }
  return null;
};

export default async function TripperBlogPreviewPage({ params }: { params: { id: string } }) {
  // No assertTripper here, as it's a public preview
  const post = await getPostById(params.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">Previsualización: {post.title}</h1>
      {/* TODO: Render the actual aspirational blog post layout here */}
      <div className="prose max-w-none">
        {post.blocks.map((block: any, index: number) => (
          <p key={index}>{block.text}</p>
        ))}
      </div>
      <p className="mt-8 text-neutral-600">Este es un placeholder para la previsualización del blog.</p>
    </div>
  );
}
