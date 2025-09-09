import Link from "next/link";
import { BlogPost } from "@/types/blog";

interface BlogListProps {
  posts: BlogPost[];
}

export default function BlogList({ posts }: BlogListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.length === 0 ? (
        <div className="lg:col-span-3 text-center p-10 border border-dashed border-neutral-300 rounded-2xl text-neutral-600">
          <h2 className="text-xl font-semibold mb-2">Aún no tienes posts.</h2>
          <p className="mb-4">¡Es hora de contar tu primera historia!</p>
          <Link href="/tripper/blogs/new" className="rt-btn rt-btn--primary">Crear mi primer post</Link>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            {post.coverUrl && (
              <div className="h-48 w-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                <img src={post.coverUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">{post.title}</h3>
              <p className="text-sm text-neutral-600 mb-3">{post.subtitle}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {post.status === 'published' ? 'Publicado' : 'Borrador'}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {post.format}
                </span>
              </div>
              <div className="flex space-x-3">
                <Link href={`/tripper/blogs/${post.id}/edit`} className="rt-btn rt-btn--secondary rt-btn--sm">Editar</Link>
                <Link href={`/tripper/blogs/${post.id}/preview`} className="rt-btn rt-btn--ghost rt-btn--sm">Previsualizar</Link>
                {/* TODO: Publicar/Despublicar, Eliminar */}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
