
'use client';
import { useJourneyStore } from '@/store/journeyStore';
import { CountryAutocomplete, CityAutocomplete } from './PlacesAutocomplete';
import NightsCalendar from './NightsCalendar';

function PaxStepper() {
  const { logistics, setPartial } = useJourneyStore();
  const { pax } = logistics;

  const setPax = (newPax: number) => {
    if (newPax >= 1) {
      setPartial({ logistics: { ...logistics, pax: newPax } });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <label htmlFor="pax-stepper" className="font-semibold">Viajeros</label>
      <div className="flex items-center gap-2">
        <button onClick={() => setPax(pax - 1)} className="btn btn-sm btn-outline">-</button>
        <span className="w-12 text-center">{pax}</span>
        <button onClick={() => setPax(pax + 1)} className="btn btn-sm btn-outline">+</button>
      </div>
    </div>
  );
}


export default function LogisticsTab() {
  const { logistics, setPartial } = useJourneyStore();
  const { country, city, startDate, pax } = logistics;

  const isCtaDisabled = !logistics.country?.name || !logistics.city?.name || !logistics.startDate || !logistics.pax || logistics.pax < 1;

  const handleContinue = () => {
    setPartial({ activeTab: 'filters' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Planificá tu Aventura Sorpresa</h2>
        <p className="text-neutral-600">Elegí país y ciudad de salida, cantidad de días y la fecha de inicio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold">País de Salida</label>
          <CountryAutocomplete />
        </div>
        <div>
          <label className="font-semibold">Ciudad de Salida</label>
          <CityAutocomplete />
        </div>
      </div>

      <PaxStepper />

      <NightsCalendar />

      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          disabled={isCtaDisabled}
          className="btn btn-primary bg-terracotta-600 hover:bg-terracotta-700 text-white disabled:bg-neutral-300"
        >
          Continuar a Filtros Premium
        </button>
      </div>
    </div>
  );
}
