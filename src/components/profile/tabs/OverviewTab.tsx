import PreferencePills from "@/components/profile/PreferencePills";
import ReviewCard from "@/components/profile/ReviewCard";
import FavoriteCard from "@/components/profile/FavoriteCard";
import EmptyState from "@/components/profile/EmptyState";
import { PublicProfile } from "@/lib/profile";

type Props = {
  data: PublicProfile;
};

export default function OverviewTab({ data }: Props) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-neutral-200 p-5 dark:border-white/10">
          <h3 className="text-lg font-semibold">Preferencias</h3>
          <div className="mt-3">
            <PreferencePills lodging={data.prefs?.lodging} style={data.prefs?.style} />
          </div>
          {data.prefs?.dailyBudgetUSD && (
            <p className="mt-3 text-sm text-neutral-600">Presupuesto diario: <strong>${data.prefs.dailyBudgetUSD}</strong></p>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 p-5 dark:border-white/10">
          <h3 className="text-lg font-semibold">Últimas reseñas</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(data.reviews?.length ? data.reviews.slice(0, 2) : []).map(r => (
              <ReviewCard key={r.id} {...r} />
            ))}
            {!data.reviews?.length && <EmptyState title="Sin reseñas aún" subtitle="Cuando publique sus primeras reseñas, aparecerán aquí." />}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-neutral-200 p-5 dark:border-white/10">
          <h3 className="text-lg font-semibold">Favoritos recientes</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(data.favorites?.length ? data.favorites.slice(0, 4) : []).map(f => (
              <FavoriteCard key={f.id} {...f} />
            ))}
            {!data.favorites?.length && <EmptyState title="Aún sin favoritos" />}
          </div>
        </div>
      </div>
    </section>
  );
}
