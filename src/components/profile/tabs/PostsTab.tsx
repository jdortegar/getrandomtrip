import EmptyState from "@/components/profile/EmptyState";
import { PublicProfile } from "@/lib/profile";

type Props = { data: PublicProfile };

// Placeholder for a Post card component
const PostCard = ({ title, excerpt, href }: { title: string; excerpt: string; href: string }) => (
  <a href={href} className="block rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
    <h4 className="font-semibold">{title}</h4>
    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{excerpt}</p>
  </a>
);

export default function PostsTab({ data }: Props) {
  const posts = data.posts ?? [];
  return (
    <section aria-labelledby="posts-heading">
      <h2 id="posts-heading" className="sr-only">Bitácoras</h2>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map(p => <PostCard key={p.id} {...p} />)}
        </div>
      ) : (
        <EmptyState title="Sin bitácoras" subtitle="Este usuario aún no ha escrito ninguna bitácora de viaje." />
      )}
    </section>
  );
}
