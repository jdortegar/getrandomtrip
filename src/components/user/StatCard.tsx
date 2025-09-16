'use client';
export default function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rt-stat rt-card-body">
      <div className="k">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}
