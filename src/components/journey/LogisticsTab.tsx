'use client';

import { useStore } from '@/store/store';
import { CountryInput, CityInput } from './PlacesAutocomplete';
import NightsCalendar from './NightsCalendar';
import StepperNav from './StepperNav';

export default function LogisticsTab() {
  const { logistics, setPartial } = useStore();

  const decPax = () =>
    setPartial({ logistics: { ...logistics, pax: Math.max(1, (logistics.pax || 1) - 1) } });

  const incPax = () =>
    setPartial({ logistics: { ...logistics, pax: Math.min(8, (logistics.pax || 1) + 1) } });

  const countryOk = Boolean(logistics.country?.name?.trim());
  const cityOk = Boolean(logistics.city?.name?.trim());
  const dateOk = Boolean(logistics.startDate);
  const paxOk = (logistics.pax ?? 0) >= 1;

  const canContinue = countryOk && cityOk && dateOk && paxOk;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-semibold">Planificá tu Aventura Sorpresa</h2>
        <p className="text-sm text-neutral-400">
          Elegí país y ciudad de salida, cantidad de días y la fecha de inicio.
        </p>
      </div>

      {/* País / Ciudad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">País de Salida</label>
          <CountryInput />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Ciudad de Salida</label>
          <CityInput />
        </div>
      </div>

      {/* Viajeros */}
      <div>
        <label className="block text-sm font-medium mb-2">Viajeros</label>
        <div className="inline-flex items-center gap-4">
          <button
            type="button"
            onClick={decPax}
            className="h-8 w-8 rounded-full border border-neutral-600 flex items-center justify-center"
            aria-label="Disminuir viajeros"
            disabled={(logistics.pax ?? 1) <= 1}
          >
            −
          </button>
          <span className="min-w-[2ch] text-center">{logistics.pax ?? 1}</span>
          <button
            type="button"
            onClick={incPax}
            className="h-8 w-8 rounded-full border border-neutral-600 flex items-center justify-center"
            aria-label="Aumentar viajeros"
            disabled={(logistics.pax ?? 1) >= 8}
          >
            +
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-400">Precio por persona.</p>
      </div>

      {/* Calendario + Noches */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Duración de la aventura</h3>
        <NightsCalendar />
      </div>

      <StepperNav />
    </div>
  );
}