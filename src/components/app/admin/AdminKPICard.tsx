interface AdminKPICardProps {
  count: number;
  label: string;
}

export function AdminKPICard({ count, label }: AdminKPICardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-4xl font-extrabold text-neutral-900">{count}</p>
    </div>
  );
}
