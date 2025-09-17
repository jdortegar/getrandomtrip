'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/store';

const order: Array<'logistics'|'preferences'|'avoid'> = ['logistics','preferences','avoid'];

export default function StepperNav() {
  const router = useRouter();
  const sp = useSearchParams();
  const { activeTab, setPartial, type, level } = useStore();

  const idx = order.indexOf(activeTab as any);
  const prev = order[Math.max(0, idx-1)];
  const next = order[Math.min(order.length-1, idx+1)];

  const goPrev = () => {
    if (activeTab === 'logistics') { router.back(); return; }
    setPartial({ activeTab: prev });
  };

  const goNext = () => {
    if (activeTab !== 'avoid') { setPartial({ activeTab: next }); return; }
    // construir query para add-ons
    const qs = new URLSearchParams(sp.toString());
    // asegurar type/level presentes
    if (!qs.get('type') && type) qs.set('type', type);
    if (!qs.get('level') && level) qs.set('level', level);
    router.push(`/journey/add-ons?${qs.toString()}`);
  };

  const nextLabel = activeTab === 'avoid' ? 'Continuar a Add-ons' : 'Continuar';
  const prevLabel = activeTab === 'logistics' ? 'Volver' : 'Volver al paso anterior';

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={goPrev}
        className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50"
      >
        {prevLabel}
      </button>
      <button
        type="button"
        onClick={goNext}
        className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium"
      >
        {nextLabel}
      </button>
    </div>
  );
}
