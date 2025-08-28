'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { premiumPackages } from '@/lib/premiumPackages';
import AppleCard from '@/components/AppleCard';
import Link from 'next/link';

const RevealDestinationPage = () => {
  const { travelType, packageId } = useParams();
  const router = useRouter();

  const pkg = premiumPackages.find((p) => p.id === packageId);

  useEffect(() => {
    if (!pkg) {
      router.push(`/packages/${travelType}`);
    }
  }, [pkg, router, travelType]);

  if (!pkg) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">
          ¡Tu Destino ha sido Revelado!
        </h1>
        <p className="text-xl text-gray-600 text-center mb-10">
          Prepárate para una aventura inolvidable.
        </p>

        <AppleCard className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Detalles de tu Viaje</h2>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Destino:</span> [Nombre del Destino]</p>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Hotel:</span> [Nombre del Hotel]</p>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Transporte:</span> [Detalles del Transporte]</p>
          <p className="text-gray-700 mb-2"><span className="font-semibold">Horarios:</span> [Horarios de Vuelo/Tren/Bus]</p>
          <p className="text-gray-700 mb-4"><span className="font-semibold">QR de Embarque:</span> [Enlace a QR]</p>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">Extras</h3>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Mapas digitales</li>
            <li>Guía digital personalizada</li>
            <li>Recomendaciones locales</li>
          </ul>

          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium mt-4 inline-block">
            Volver al inicio
          </Link>
        </AppleCard>
      </div>
    </div>
  );
};

export default RevealDestinationPage;
