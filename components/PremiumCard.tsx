
// components/PremiumCard.tsx
import React from 'react';
import { PremiumPackage } from '../lib/premiumPackages';

interface PremiumCardProps {
  pkg: PremiumPackage;
  isSolo: boolean;
}

const PremiumCard: React.FC<PremiumCardProps> = ({ pkg, isSolo }) => {
  const adjustedBudget = isSolo ? pkg.budget * 1.5 : pkg.budget;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{pkg.tagline}</p>
        <div className="mb-4">
          <p className="text-xl font-semibold text-indigo-600">
            {pkg.budgetType} ${adjustedBudget.toLocaleString('en-US')} USD
          </p>
          {isSolo && (
            <p className="text-xs text-gray-500 mt-1">Precios ajustados por cantidad de pasajero.</p>
          )}
        </div>
        <ul className="text-gray-700 text-sm space-y-1 mb-4">
          <li><span className="font-medium">Noches:</span> Hasta {pkg.maxNights}</li>
          <li><span className="font-medium">Alojamiento:</span> {pkg.accommodation}</li>
          <li><span className="font-medium">Transporte:</span> {pkg.transportation}</li>
          <li><span className="font-medium">Extras clave:</span> {pkg.keyExtras.join(', ')}</li>
          <li><span className="font-medium">Arquetipo:</span> {pkg.archetype}</li>
          <li><span className="font-medium">Canales:</span> {pkg.channels.join(', ')}</li>
        </ul>
        <button className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300">
          {pkg.ctaText}
        </button>
      </div>
    </div>
  );
};

export default PremiumCard;
