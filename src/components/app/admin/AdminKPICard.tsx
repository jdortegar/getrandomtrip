interface AdminKPICardProps {
  count: number;
  label: string;
}

export function AdminKPICard({ count, label }: AdminKPICardProps) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-barlow-condensed text-2xl font-extrabold text-gray-900">{count}</p>
    </div>
  );
}
