import FavoriteCard from "@/components/profile/FavoriteCard";
import EmptyState from "@/components/profile/EmptyState";
import { PublicProfile } from "@/lib/profile";

type Props = { data: PublicProfile };

export default function FavoritesTab({ data }: Props) {
  const favorites = data.favorites ?? [];
  return (
    <section aria-labelledby="favorites-heading">
      <h2 id="favorites-heading" className="sr-only">Favoritos</h2>
      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map(f => <FavoriteCard key={f.id} {...f} />)}
        </div>
      ) : (
        <EmptyState title="Sin favoritos" subtitle="Este usuario aún no ha guardado ningún favorito." />
      )}
    </section>
  );
}
