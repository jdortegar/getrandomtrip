'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Navbar from '@/components/Navbar';
import ChatFab from '@/components/chrome/ChatFab';
import BgCarousel from '@/components/media/BgCarousel';
import GlassCard from '@/components/ui/GlassCard';

import { useStore } from '@/store/store';
import { ADDONS } from '@/data/addons-catalog';
import { computeAddonsCostPerTrip, computeFiltersCostPerTrip } from '@/lib/pricing';

const usd = (n: number) => `USD ${n.toFixed(2)}`;

export default function SummaryPage() {
  const router = useRouter();
  const { basePriceUsd, displayPrice, logistics, filters, addons, level, type } = useStore();

  const pax = logistics.pax || 1;
  const basePerPax = basePriceUsd || 0;

  const filtersTrip = computeFiltersCostPerTrip(filters, pax);
  const { totalTrip: addonsTrip, cancelCost } =
    computeAddonsCostPerTrip(addons.selected, basePerPax, filtersTrip, pax);

  const filtersPerPax = (filtersTrip / pax) || 0;
  const addonsPerPax  = (addonsTrip  / pax) || 0;
  const totalPerPax   = basePerPax + filtersPerPax + addonsPerPax;
  const totalTrip     = totalPerPax * pax;

  const chips: string[] = [];
  if (filters.climate !== 'indistinto') chips.push(`Clima: ${labelCL(filters.climate)}`);
  if (filters.maxTravelTime !== 'sin-limite') chips.push(`Máx: ${labelTT(filters.maxTravelTime)}`);
  if (filters.departPref !== 'indistinto') chips.push(`Salida: ${labelDP(filters.departPref)}`);
  if (filters.arrivePref !== 'indistinto') chips.push(`Llegada: ${labelDP(filters.arrivePref)}`);
  (filters.avoidDestinations || []).forEach((n) => chips.push(`Evitar: ${n}`));

  const addonRows = addons.selected.map((s) => {
    const a = ADDONS.find((x) => x.id === s.id);
    if (!a) return null;
    const delta = a.options?.find((o) => o.id === s.optionId)?.deltaUsd ?? 0;
    const unitPrice = a.priceUsd + delta;
    const qty = s.qty || 1;
    const lineTotal =
      a.unit === 'per_pax' ? unitPrice * pax * qty :
      a.unit === 'per_trip' ? unitPrice * qty : 0;

    return {
      id: s.id,
      title: a.title + (s.optionId ? ` · ${a.options?.find(o => o.id === s.optionId)?.label}` : ''),
      total: lineTotal,
    };
  }).filter(Boolean) as { id: string; title: string; total: number }[];

  const backToAddons = () => router.push('/journey/add-ons');
  const payNow       = () => router.push('/journey/checkout');

  return (
    <>
      <Navbar />
      <div id="hero-sentinel" aria-hidden className="h-px w-px" />
      <BgCarousel scrim={0.65} />

      <main className="container mx-auto px-4 pb-16 pt-28 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <GlassCard>
            <div className="p-4 md:p-5">
              <h1 className="text-lg font-semibold text-neutral-900 mb-2">Resumen del viaje</h1>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <div className="text-neutral-600">Ciudad</div>
                  <div className="font-medium text-neutral-900">{logistics.city?.name ?? '—'}</div>
                </div>
                <div>
                  <div className="text-neutral-600">Fechas</div>
                  <div className="font-medium text-neutral-900">
                    {logistics.startDate ?? '—'} → {logistics.endDate ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-600">Viajeros</div>
                  <div className="font-medium text-neutral-900">{pax}</div>
                </div>
                <div>
                  <div className="text-neutral-600">Tipo</div>
                  <div className="font-medium text-neutral-900">{type} • {level}</div>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 md:p-5">
              <h2 className="text-base font-semibold text-neutral-900 mb-3">Filtros premium</h2>
              <div className="flex flex-wrap gap-2">
                {chips.length ? (
                  chips.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center rounded-full bg-violet-50 text-violet-900 border border-violet-200 px-3 py-1 text-sm"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-neutral-600">Sin filtros adicionales.</span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4 md:p-5">
              <h2 className="text-base font-semibold text-neutral-900 mb-3">Tus add-ons</h2>
              <div className="divide-y divide-neutral-200/90">
                {addonRows.length ? addonRows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="font-medium text-neutral-900">{r.title}</div>
                    <div className="text-sm font-medium text-neutral-900">{usd(r.total)}</div>
                  </div>
                )) : (
                  <div className="text-sm text-neutral-700 py-2">Aún no agregaste add-ons.</div>
                )}
                {cancelCost > 0 && (
                  <div className="flex items-center justify-between py-3 bg-amber-50/80 px-3 rounded-lg mt-2">
                    <div className="text-neutral-900 font-medium">Seguro de cancelación · 15% del subtotal</div>
                    <div className="text-sm font-medium text-neutral-900">{usd(cancelCost)}</div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Columna derecha */}
        <aside>
          <GlassCard>
            <div className="p-4 md:p-5 space-y-3">
              <h3 className="text-base font-semibold text-neutral-900">Precio</h3>

              <Row label="Base por persona" value={displayPrice || usd(basePerPax)} />
              <Row label="Filtros premium"   value={usd(filtersPerPax)} />
              <Row label="Add-ons"           value={usd(addonsPerPax)} />

              <div className="h-px bg-neutral-200/90 my-1" />

              <Row label="Total por persona" value={usd(totalPerPax)} bold />
              <Row label={`Total (x${pax})`} value={usd(totalTrip)} bold />

              <button
                onClick={backToAddons}
                className="w-full rounded-xl border border-neutral-300 bg-white text-neutral-900 py-2 hover:bg-neutral-50"
              >
                ← Volver a add-ons
              </button>

              <button
                onClick={payNow}
                className="w-full rounded-xl bg-violet-600 text-white py-2.5 font-medium hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Continuar a pago
              </button>
            </div>
          </GlassCard>
        </aside>
      </main>

      <ChatFab />
    </>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-700">{label}</span>
      <span className={bold ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-900'}>{value}</span>
    </div>
  );
}

/** Helpers tipados para evitar indexar con `any` */
function labelCL(v: unknown): string {
  switch (String(v)) {
    case 'calido': return 'Cálido';
    case 'frio': return 'Frío';
    case 'templado': return 'Templado';
    case 'indistinto': return 'Indistinto';
    default: return String(v ?? '');
  }
}

function labelTT(v: unknown): string {
  switch (String(v)) {
    case '3h': return '3h';
    case '5h': return '5h';
    case '8h': return '8h';
    case 'sin-limite': return 'Sin límite';
    default: return String(v ?? '');
  }
}

function labelDP(v: unknown): string {
  switch (String(v)) {
    case 'manana': return 'mañana';
    case 'tarde': return 'tarde';
    case 'noche': return 'noche';
    case 'indistinto': return 'indistinto';
    default: return String(v ?? '');
  }
}
