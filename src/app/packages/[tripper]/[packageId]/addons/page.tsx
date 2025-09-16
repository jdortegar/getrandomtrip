
// frontend/src/app/packages/[type]/addons/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { premiumPackages } from '@/lib/premiumPackages';
import AppleCard from '@/components/AppleCard';
import AppleButton from '@/components/AppleButton';
import AddonOption from '@/components/AddonOption';

interface Addon {
  id: string;
  title: string;
  description: string;
  price: number; // Price per unit
  costType: 'per_person' | 'per_reservation';
}

const allAddons: Addon[] = [
  // Seguro de cancelación flexible: 15% del valor del viaje sorpresa (omitted for now)
  { id: 'seguro-viajes', title: 'Seguro de Viajes', description: '', price: 35, costType: 'per_person' },
  { id: 'seleccion-asiento', title: 'Selección de Asiento', description: '', price: 15, costType: 'per_person' },
  { id: 'carry-on', title: 'Carry on', description: '', price: 15, costType: 'per_person' },
  { id: 'equipaje-documentado', title: 'Equipaje documentado', description: '', price: 25, costType: 'per_person' },
  { id: 'esims', title: 'eSIMs (Digital Packs)', description: '', price: 25, costType: 'per_person' },
  { id: 'upgrade-alojamiento', title: 'Upgrade de Alojamiento / Habitación', description: 'Por persona por noche', price: 50, costType: 'per_person' }, // Assuming per night, needs nights from pkg
  { id: 'desayuno-hotel', title: 'Desayuno en Hotel', description: 'Por persona por día', price: 15, costType: 'per_person' }, // Assuming per day, needs days from pkg
  { id: 'apu-destino', title: 'APU en destino (recogida en aeropuerto a la llegada)', description: 'Precio fijo por reserva', price: 30, costType: 'per_reservation' },
  { id: 'ado-destino', title: 'ADO en destino (llevarlos al aeropuerto para regresar a casa)', description: 'Precio fijo por reserva', price: 30, costType: 'per_reservation' },
  { id: 'alquiler-vehiculo', title: 'Alquiler de vehículo en destino', description: 'Precio fijo por reserva por día', price: 50, costType: 'per_reservation' }, // Assuming per day, needs days from pkg
  { id: 'experiencia-destino', title: 'Experiencia en destino', description: '', price: 50, costType: 'per_person' },
  { id: 'randomtrip-advisor-decode', title: 'Randomtrip Advisor Decode (Guia y tips personalizada)', description: 'Precio fijo por reserva', price: 20, costType: 'per_reservation' },
];

const AddonsPage = () => {
  const { travelType, packageId } = useParams();
  const router = useRouter();

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [travelers, setTravelers] = useState(1); // This should ideally come from previous step's state
  const [filtersCostPerPerson, setFiltersCostPerPerson] = useState(0); // This should come from previous step's state

  const pkg = premiumPackages.find((p) => p.id === packageId);

  useEffect(() => {
    if (!pkg) {
      router.push(`/packages/${travelType}`);
    }
    // In a real app, you'd load travelers and filtersCostPerPerson from context/global state
  }, [pkg, router, travelType]);

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const calculateAddonCosts = useMemo(() => {
    let totalAddonCost = 0;
    selectedAddons.forEach((addonId) => {
      const addon = allAddons.find((a) => a.id === addonId);
      if (addon) {
        if (addon.costType === 'per_person') {
          totalAddonCost += addon.price * travelers;
        } else { // per_reservation
          totalAddonCost += addon.price;
        }
      }
    });
    const addonCostPerPerson = totalAddonCost / travelers; // Average cost per person
    return { addonCostPerPerson, totalAddonCost };
  }, [selectedAddons, travelers]);

  const totalPerPerson = filtersCostPerPerson + calculateAddonCosts.addonCostPerPerson;
  const grandTotal = (filtersCostPerPerson * travelers) + calculateAddonCosts.totalAddonCost;

  if (!pkg) {
    return null; // Or a loading spinner
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save selected add-ons and costs to state/context
    // Navigate to the next step (e.g., summary or checkout)
    router.push(`/packages/${travelType}/${packageId}/decode-addons`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">
          {pkg.title}
        </h1>
        <p className="text-xl text-gray-600 text-center mb-10">
          {pkg.tagline}
        </p>

        <AppleCard className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add-ons</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {allAddons.map((addon) => (
              <AddonOption
                key={addon.id}
                id={addon.id}
                title={addon.title}
                description={addon.description}
                price={addon.price}
                isSelected={selectedAddons.includes(addon.id)}
                onToggle={handleAddonToggle}
              />
            ))}

            <div className="border-t border-gray-200 pt-6 mt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen</h3>
              <p className="text-gray-700 mb-2">Add-ons seleccionados: {selectedAddons.length}</p>
              <p className="text-gray-700 mb-2">Costo extra por persona: ${calculateAddonCosts.addonCostPerPerson.toFixed(2)} USD</p>
              <p className="text-gray-700 mb-4">Costo extra total: ${calculateAddonCosts.totalAddonCost.toFixed(2)} USD</p>
              <div className="border-t border-gray-200 my-4"></div>
              <p className="text-lg font-semibold text-gray-800 mb-2">Filtros + add-ons por persona: ${totalPerPerson.toFixed(2)} USD</p>
              <p className="text-lg font-semibold text-gray-800 mb-4">Filtros + add-ons total: ${grandTotal.toFixed(2)} USD</p>
              <AppleButton type="submit">Continuar</AppleButton>
            </div>
          </form>
        </AppleCard>
      </div>
    </div>
  );
};

export default AddonsPage;
