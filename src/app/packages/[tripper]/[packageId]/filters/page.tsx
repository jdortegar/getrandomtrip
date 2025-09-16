
// frontend/src/app/packages/[type]/filters/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { premiumPackages } from '@/lib/premiumPackages';
import AppleCard from '@/components/AppleCard';
import AppleButton from '@/components/AppleButton';
import FilterOptionCard from '@/components/FilterOptionCard';

interface Filter {
  id: string;
  title: string;
  type: 'transportation' | 'experience' | 'climate' | 'flightTime' | 'departureWindow' | 'returnWindow' | 'avoidDestination';
  price: number; // Price per person for this filter
}

const allFilters: Filter[] = [
  // Medio de Transporte Preferido (Obligatorio, 1er filtro gratis)
  { id: 'transport-avion', title: 'Avión', type: 'transportation', price: 0 },
  { id: 'transport-bus', title: 'Bus', type: 'transportation', price: 0 },
  { id: 'transport-barco', title: 'Barco', type: 'transportation', price: 0 },
  { id: 'transport-tren', title: 'Tren', type: 'transportation', price: 0 },

  // Tipo de experiencia (Sin Preferencia, por default sin costo extra)
  { id: 'experience-no-pref', title: 'Sin Preferencia', type: 'experience', price: 0 },
  { id: 'experience-playa-sol', title: 'Playa/Sol', type: 'experience', price: 0 },
  { id: 'experience-ciudad-cultura', title: 'Ciudad/Cultura', type: 'experience', price: 0 },
  { id: 'experience-naturaleza-aventura', title: 'Naturaleza/Aventura', type: 'experience', price: 0 },
  { id: 'experience-relax-bienestar', title: 'Relax/Bienestar', type: 'experience', price: 0 },

  // Clima preferido (Sin Preferencia, por default sin costo extra)
  { id: 'climate-no-pref', title: 'Sin Preferencia', type: 'climate', price: 0 },
  { id: 'climate-calido', title: 'Cálido', type: 'climate', price: 0 },
  { id: 'climate-templado', title: 'Templado', type: 'climate', price: 0 },
  { id: 'climate-frio', title: 'Frio', type: 'climate', price: 0 },

  // Tiempo Máximo en viaje (Sin Preferencia, por default sin costo extra)
  { id: 'flight-no-pref', title: 'Sin Preferencia', type: 'flightTime', price: 0 },
  { id: 'flight-3h', title: 'Hasta 3 horas', type: 'flightTime', price: 0 },
  { id: 'flight-6h', title: 'Hasta 6 horas', type: 'flightTime', price: 0 },
  { id: 'flight-9h', title: 'Hasta 9 horas', type: 'flightTime', price: 0 },
  { id: 'flight-12h', title: 'Hasta 12 horas', type: 'flightTime', price: 0 },

  // Horario Preferido de Salida (Sin Preferencia, por default sin costo extra)
  { id: 'dep-no-pref', title: 'Sin Preferencia', type: 'departureWindow', price: 0 },
  { id: 'dep-morning', title: 'Mañana (antes de 12pm)', type: 'departureWindow', price: 0 },
  { id: 'dep-afternoon', title: 'Tarde (12pm a 6pm)', type: 'departureWindow', price: 0 },
  { id: 'dep-night', title: 'Noche (después de 6pm)', type: 'departureWindow', price: 0 },

  // Horario Preferido de Llegada (Regreso) (Sin Preferencia, por default sin costo extra)
  { id: 'ret-no-pref', title: 'Sin Preferencia', type: 'returnWindow', price: 0 },
  { id: 'ret-morning', title: 'Mañana (antes de 12pm)', type: 'returnWindow', price: 0 },
  { id: 'ret-afternoon', title: 'Tarde (12pm a 6pm)', type: 'returnWindow', price: 0 },
  { id: 'ret-night', title: 'Noche (después de 6pm)', type: 'returnWindow', price: 0 },

  // Evitar destinos específicos (15 predefinidos + 1 custom)
  { id: 'avoid-buenos-aires', title: 'Buenos Aires', type: 'avoidDestination', price: 0 },
  { id: 'avoid-cordoba', title: 'Córdoba', type: 'avoidDestination', price: 0 },
  { id: 'avoid-mendoza', title: 'Mendoza', type: 'avoidDestination', price: 0 },
  { id: 'avoid-bariloche', title: 'Bariloche', type: 'avoidDestination', price: 0 },
  { id: 'avoid-iguazu', title: 'Iguazú', type: 'avoidDestination', price: 0 },
  { id: 'avoid-salta', title: 'Salta', type: 'avoidDestination', price: 0 },
  { id: 'avoid-ushuaia', title: 'Ushuaia', type: 'avoidDestination', price: 0 },
  { id: 'avoid-mexico-city', title: 'Ciudad de México', type: 'avoidDestination', price: 0 },
  { id: 'avoid-cancun', title: 'Cancún', type: 'avoidDestination', price: 0 },
  { id: 'avoid-guadalajara', title: 'Guadalajara', type: 'avoidDestination', price: 0 },
  { id: 'avoid-monterrey', title: 'Monterrey', type: 'avoidDestination', price: 0 },
  { id: 'avoid-playa-del-carmen', title: 'Playa del Carmen', type: 'avoidDestination', price: 0 },
  { id: 'avoid-tulum', title: 'Tulum', type: 'avoidDestination', price: 0 },
  { id: 'avoid-oaxaca', title: 'Oaxaca', type: 'avoidDestination', price: 0 },
  { id: 'avoid-san-miguel', title: 'San Miguel de Allende', type: 'avoidDestination', price: 0 },
  { id: 'avoid-custom', title: 'Otro (especificar)', type: 'avoidDestination', price: 0 },
];

const FiltersPage = () => {
  const { travelType, packageId } = useParams();
  const router = useRouter();

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [travelers, setTravelers] = useState(1); // This should ideally come from previous step's state

  const pkg = premiumPackages.find((p) => p.id === packageId);

  useEffect(() => {
    if (!pkg) {
      router.push(`/packages/${travelType}`);
    }
    // In a real app, you'd load travelers from context/global state
    // For now, we'll use a placeholder or default to 1
  }, [pkg, router, travelType]);

  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  const calculateFilterCosts = useMemo(() => {
    const numSelectedFilters = selectedFilters.length;
    let costPerPerson = 0;

    if (numSelectedFilters > 0) {
      // 1st filter free
      if (numSelectedFilters >= 2) {
        costPerPerson += (Math.min(numSelectedFilters, 3) - 1) * 18; // 2nd and 3rd filter at $18
      }
      if (numSelectedFilters >= 4) {
        costPerPerson += (numSelectedFilters - 3) * 25; // 4th and subsequent at $25
      }
    }
    const totalCost = costPerPerson * travelers;
    return { costPerPerson, totalCost };
  }, [selectedFilters, travelers]);

  if (!pkg) {
    return null; // Or a loading spinner
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save selected filters and costs to state/context
    router.push(`/packages/${travelType}/${packageId}/addons`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">
          {pkg.title}
        </h1>
        <p className="text-xl text-gray-600 text-center mb-10">
          {pkg.tagline}
        </p>

        <AppleCard className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Premium Filters</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-4">Transportation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allFilters.filter(f => f.type === 'transportation').map(filter => (
                  <FilterOptionCard
                    key={filter.id}
                    title={filter.title}
                    isSelected={selectedFilters.includes(filter.id)}
                    onSelect={() => handleFilterToggle(filter.id)}
                    price={filter.price}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-4">Experience Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allFilters.filter(f => f.type === 'experience').map(filter => (
                  <FilterOptionCard
                    key={filter.id}
                    title={filter.title}
                    isSelected={selectedFilters.includes(filter.id)}
                    onSelect={() => handleFilterToggle(filter.id)}
                    price={filter.price}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-4">Clima preferido</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {allFilters.filter(f => f.type === 'climate').map(filter => (
                  <FilterOptionCard
                    key={filter.id}
                    title={filter.title}
                    isSelected={selectedFilters.includes(filter.id)}
                    onSelect={() => handleFilterToggle(filter.id)}
                    price={filter.price}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-4">Tiempo Máximo en viaje</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allFilters.filter(f => f.type === 'flightTime').map(filter => (
                  <FilterOptionCard
                    key={filter.id}
                    title={filter.title}
                    isSelected={selectedFilters.includes(filter.id)}
                    onSelect={() => handleFilterToggle(filter.id)}
                    price={filter.price}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-4">Preferred Departure/Return Windows</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allFilters.filter(f => f.type === 'departureWindow').map(filter => (
                  <FilterOptionCard
                    key={filter.id}
                    title={filter.title}
                    isSelected={selectedFilters.includes(filter.id)}
                    onSelect={() => handleFilterToggle(filter.id)}
                    price={filter.price}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-4">Avoid Specific Destinations</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allFilters.filter(f => f.type === 'avoidDestination').map(filter => (
                  <FilterOptionCard
                    key={filter.id}
                    title={filter.title}
                    isSelected={selectedFilters.includes(filter.id)}
                    onSelect={() => handleFilterToggle(filter.id)}
                    price={filter.price}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Summary</h3>
              <p className="text-gray-700 mb-2">Filters selected: {selectedFilters.length}</p>
              <p className="text-gray-700 mb-2">Extra cost per person: ${calculateFilterCosts.costPerPerson.toFixed(2)} USD</p>
              <p className="text-gray-700 mb-4">Total extra cost: ${calculateFilterCosts.totalCost.toFixed(2)} USD</p>
              <AppleButton type="submit">Continue</AppleButton>
            </div>
          </form>
        </AppleCard>
      </div>
    </div>
  );
};

export default FiltersPage;
