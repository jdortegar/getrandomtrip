'use client';
import { useRouter } from 'next/navigation';
import { TRIPPER_TIERS } from '@/content/tiers';

export default function TripperTiers({ tripperSlug }: { tripperSlug: string }) {
  const router = useRouter();
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <h2 className="text-xl font-medium">Selecciona tu Nivel de Experiencia</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {TRIPPER_TIERS.map(t => (
          <div key={t.key} className="h-full flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition">
            <h4 className="font-semibold text-neutral-900">{t.title}</h4>
            <ul className="mt-3 text-sm text-neutral-800 list-disc pl-5 space-y-1 flex-1">
              {t.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <button
                data-testid={t.testid}
                className="w-full inline-flex items-center justify-center rounded-full bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-800"
                onClick={() => router.push(`/journey/experience-level?from=tripper&tripper=${tripperSlug}&tier=${t.key}`)}
              >
                {t.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}