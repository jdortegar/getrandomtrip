import ReviewCard from "@/components/profile/ReviewCard";
import EmptyState from "@/components/profile/EmptyState";
import { PublicProfile } from "@/lib/profile";

type Props = { data: PublicProfile };

export default function ReviewsTab({ data }: Props) {
  const reviews = data.reviews ?? [];
  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="sr-only">Reseñas</h2>
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map(r => <ReviewCard key={r.id} {...r} />)}
        </div>
      ) : (
        <EmptyState title="Sin reseñas" subtitle="Este usuario aún no ha publicado ninguna reseña." />
      )}
    </section>
  );
}
