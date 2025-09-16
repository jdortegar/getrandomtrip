import StatCard from "@/components/user/StatCard";
import { formatUSD } from "@/lib/format";

export default function ProfileStats({ b, spendUSD, r, f }: { b: number; spendUSD: number; r: number; f: number }) {
  return (
    <section className="rt-stats my-6">
      <StatCard label="Reservas (12m)" value={b} />
      <StatCard label="Gasto total" value={formatUSD(spendUSD)} />
      <StatCard label="Reseñas" value={r} />
      <StatCard label="Favoritos" value={f} />
    </section>
  );
}
