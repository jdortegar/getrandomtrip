'use client';

import { useParams, useRouter } from 'next/navigation';
import { getTiersForDisplay } from '@/lib/utils/experiencesData';

export default function TripperTiers({
  tripperSlug,
  type = 'couple',
}: {
  tripperSlug: string;
  type?: string;
}) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'es';
  const tiers = getTiersForDisplay(type, locale);

  return (
    <section className="rt-container px-4 py-10 md:px-8">
      <h2 className="text-xl font-medium">Selecciona tu Nivel de Experiencia</h2>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        {tiers.map((t) => (
          <div
            key={t.key}
            className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <h4 className="font-semibold text-neutral-900">{t.title}</h4>
            <ul className="mt-3 flex-1 list-disc space-y-1 pl-5 text-sm text-neutral-800">
              {t.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <div className="mt-6 border-t border-neutral-200 pt-4">
              <button
                className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                data-testid={t.testid}
                onClick={() =>
                  router.push(
                    `/journey?from=tripper&tripper=${tripperSlug}&tier=${t.key}`,
                  )
                }
                type="button"
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