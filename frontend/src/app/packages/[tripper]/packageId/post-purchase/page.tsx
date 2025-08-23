'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { premiumPackages } from '@/lib/premiumPackages';
import AppleCard from '@/components/AppleCard';
import Link from 'next/link';

const PostPurchasePage = () => {
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
          ¡Gracias por tu compra!
        </h1>
        <p className="text-xl text-gray-600 text-center mb-10">
          Tu viaje sorpresa está en camino.
        </p>

        <AppleCard className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">¿Qué sigue?</h2>
          <p className="text-gray-700 mb-2">Recibirás un mail de confirmación con los detalles de tu reserva.</p>
          <p className="text-gray-700 mb-2">Puedes acceder a tu cuenta de usuario para ver el estado de tu viaje.</p>
          <p className="text-gray-700 mb-4">¡Prepárate para la revelación de tu destino 48 horas antes de tu viaje!</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium mt-4 inline-block">
            Ir a mi cuenta
          </Link>
        </AppleCard>
      </div>
    </div>
  );
};

export default PostPurchasePage;
