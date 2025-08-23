import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/common/SafeImage';
import { TRIPPERS, type Tripper } from '@/content/trippers';

export const metadata: Metadata = {
  title: 'Viajes en Grupo · Top Trippers | Randomtrip',
  description:
    'Explorá los perfiles de nuestros Trippers y elegí con quién querés co-crear tu Randomtrip.',
};

function TripperCard({ t }: { t: Tripper }) {
  return (
    <Link
      href={`/packages/${t.slug}`}
      className="group block rounded-2xl border border-neutral-200 bg-white hover:shadow-md transition shadow-sm overflow-hidden"
      aria-label={`Ver perfil de ${t.name}`}
    >
      <div className="relative h-56 w-full">
        <SafeImage
          src={t.heroImage ?? t.avatar ?? null}
          alt={t.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-neutral-900 group-hover:underline">
          {t.name}
        </h3>
        {(t.agency || t.location) && (
          <p className="mt-1 text-sm text-neutral-600">
            {t.agency}
            {t.agency && t.location ? ' · ' : ''}
            {t.location}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function GroupByTypePage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <header className="text-center">
          <h1 className="text-2xl md:text-4xl font-bold">Top Trippers</h1>
          <p className="mt-2 text-neutral-600">
            Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {TRIPPERS.map((t) => (
            <TripperCard key={t.slug} t={t} />
          ))}
        </div>
      </section>
    </main>
  );
}
