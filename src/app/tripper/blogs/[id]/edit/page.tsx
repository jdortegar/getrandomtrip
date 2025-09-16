import { assertTripper } from "@/lib/auth";
import BlogComposer from "@/components/tripper/blog/BlogComposer";
import type { BlogPost } from "@/components/tripper/blog/types";
// opcional: import { demoPosts } from "@/components/tripper/blog/mock";

export default async function TripperEditBlogPage({ params }: { params: { id: string } }) {
  await assertTripper();
  const { id } = params;

  // Mock correcto (puedes buscar en demoPosts por id si lo prefieres)
  const post: BlogPost = {
    id,
    title: "Mi primer viaje sorpresa",
    subtitle: "Cómo un fin de semana se convirtió en transformación",
    blocks: [
      { type: "paragraph", text: "Este es un ejemplo de párrafo inicial." },
      { type: "image", url: "/images/placeholders/photo-1.jpg", caption: "Momento dorado" },
      { type: "quote", text: "Viajar es vivir dos veces.", cite: "Omar Khayyam" },
      { type: "embed", provider: "youtube", url: "https://www.youtube.com/embed/xxxx" }
    ],
    status: "draft"
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">Editar Post: {post.title}</h1>
      <BlogComposer post={post} mode="edit" />
    </div>
  );
}