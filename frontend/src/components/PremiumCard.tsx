import React from 'react';
import { PremiumPackage } from '@/lib/premiumPackages';
import Link from 'next/link';
import { formatUSD } from '@/lib/format';

interface PremiumCardProps {
  pkg: PremiumPackage;
  isSolo: boolean;
  href: string;
}

const PremiumCard: React.FC<PremiumCardProps> = ({ pkg, isSolo, href }) => {
  const adjustedBudget = isSolo ? pkg.budget * 1.5 : pkg.budget;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 h-full flex flex-col">
      <div className="p-6 flex-grow">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{pkg.tagline}</p>
        <div className="mb-4">
          <p className="text-xl font-semibold text-indigo-600">
            {formatUSD(adjustedBudget)}
          </p>
          {isSolo && (
            <p className="text-xs text-gray-500 mt-1">Precios ajustados por cantidad de pasajero.</p>
          )}
        </div>
        <ul className="text-gray-700 text-sm space-y-1 mb-4">
          <li><span className="font-medium">Noches:</span> {pkg.nights}</li>
          <li><span className="font-medium">Alojamiento:</span> {pkg.lodging}</li>
          <li><span className="font-medium">Transporte:</span> {pkg.transport}</li>
          <li><span className="font-medium">Extras:</span> {pkg.extras}</li>
        </ul>
      </div>
      <div className="p-6 pt-0">
        <Link href={href} passHref>
          <div className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300 text-center cursor-pointer">
            Reservar
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PremiumCard;