export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-600 dark:border-white/20 dark:text-neutral-300">
      <h4 className="font-semibold">{title}</h4>
      {subtitle && <p className="mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}
