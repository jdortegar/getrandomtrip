type Props = { title: string; rating: number; excerpt: string; date?: string };
export default function ReviewCard({ title, rating, excerpt, date }: Props) {
  return (
    <article className="rounded-2xl border border-neutral-200 p-4 shadow-sm dark:border-white/10">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{title}</h4>
        <div aria-label={`Rating ${rating} de 5`} className="text-amber-500">{'★'.repeat(rating)}{'☆'.repeat(5-rating)}</div>
      </div>
      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{excerpt}</p>
      {date && <div className="mt-2 text-xs text-neutral-500">{date}</div>}
    </article>
  );
}
