'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { premiumPackages } from '@/lib/premiumPackages';
import AppleCard from '@/components/AppleCard';

export default function CheckoutPage() {
  const { travelType, packageId } = useParams() as { travelType: string; packageId: string };
  const router = useRouter();

  const pkg = useMemo(() => premiumPackages.find(p => p.id === packageId), [packageId]);

  const [totalPrice] = useState(1500);
  const [pricePerPerson] = useState(750);
  const [travelers] = useState(2);

  useEffect(() => {
    if (!pkg) router.push(`/packages/${travelType}`);
  }, [pkg, router, travelType]);

  if (!pkg) return null;

  const handlePayment = (method: string) => {
    alert(`Simulating payment with ${method} for ${totalPrice} USD`);
    // In a real application, this would involve actual payment processing
    router.push(`/packages/${travelType}/${packageId}/post-purchase`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">{pkg.title}</h1>
        <p className="text-xl text-gray-600 text-center mb-10">{pkg.tagline}</p>

        <AppleCard className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Resumen de tu Viaje</h2>
          <div className="space-y-4 text-gray-700 mb-6">
            <p className="text-lg"><span className="font-semibold">Paquete:</span> {pkg.title}</p>
            <p className="text-lg"><span className="font-semibold">Noches:</span> {pkg.maxNights}</p>
            <p className="text-lg"><span className="font-semibold">Nº de Viajeros:</span> {travelers}</p>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-xl font-semibold text-gray-800">Precio por persona: ${pricePerPerson.toFixed(2)} USD</p>
              <p className="text-2xl font-bold text-indigo-600">Total a bloquear en Tarjeta de Crédito: ${totalPrice.toFixed(2)} USD</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Simular Pasarela de Pago</h2>
          <div className="space-y-4">
            <button onClick={() => handlePayment('Mercado Pago')} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300">Pagar con Mercado Pago</button>
            <button onClick={() => handlePayment('PayPal')} className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-md hover:bg-yellow-600 transition-colors duration-300">Pagar con PayPal</button>
          </div>
        </AppleCard>
      </div>
    </div>
  );
}