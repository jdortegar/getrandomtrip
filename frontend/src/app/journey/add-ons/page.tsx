'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PrimaryButton from '@/components/PrimaryButton';
import { Booking } from '@/types';

const addonOptions = [
  { id: 'insurance_cancellation', label: 'Seguro de cancelación flexible', price: 0.15, type: 'percentage' },
  { id: 'insurance_travel', label: 'Seguro de Viajes', price: 35, type: 'per_person' },
  { id: 'seat_selection', label: 'Selección de Asiento', price: 15, type: 'per_person' },
  { id: 'breakfast', label: 'Desayuno en Hotel', price: 15, type: 'per_person_per_day' },
  { id: 'airport_pickup', label: 'Recogida en aeropuerto (APU)', price: 30, type: 'per_booking' },
  { id: 'airport_dropoff', label: 'Traslado al aeropuerto (ADO)', price: 30, type: 'per_booking' },
  { id: 'car_rental', label: 'Alquiler de vehículo', price: 50, type: 'per_day' },
];

function AddonsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) {
      const fetchBooking = async () => {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`);
        if (response.ok) {
          const data = await response.json();
          setBooking(data);
        } else {
          setError('No se pudo cargar la información de la reserva.');
        }
        setIsLoading(false);
      };
      fetchBooking();
    }
  }, [bookingId]);
  
  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const addonsCost = useMemo(() => {
    if (!booking) return 0;
    
    let total = 0;
    const travelerCount = booking.travelerCount;
    const durationNights = booking.duration_nights || 1; // Asumimos 1 noche si no está definido
    const baseTotal = booking.totalPrice; // Usamos el precio total acumulado para el seguro

    for (const addonId of selectedAddons) {
      const addon = addonOptions.find(a => a.id === addonId);
      if (!addon) continue;

      switch (addon.type) {
        case 'percentage':
          total += baseTotal * addon.price;
          break;
        case 'per_person':
          total += addon.price * travelerCount;
          break;
        case 'per_person_per_day':
          total += addon.price * travelerCount * durationNights;
          break;
        case 'per_day':
          total += addon.price * durationNights;
          break;
        case 'per_booking':
          total += addon.price;
          break;
      }
    }
    return total;
  }, [selectedAddons, booking]);

  const handleSubmit = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          selectedAddons: { selected: selectedAddons },
          addonsCost: addonsCost
        }),
      });
      router.push(`/journey/summary?bookingId=${bookingId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se pudieron guardar los add-ons.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !booking) {
    return <div className="bg-[#111827] h-screen text-white flex items-center justify-center">Cargando...</div>;
  }

  return (
    <main className="bg-[#111827] text-white min-h-screen p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Servicios Adicionales</h1>
        <p className="text-lg text-gray-300 text-center mb-12">Añade esos toques finales que harán tu viaje aún más memorable.</p>

        <div className="space-y-4">
          {addonOptions.map(addon => (
            <div
              key={addon.id}
              onClick={() => handleAddonToggle(addon.id)}
              className={`p-4 border rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                selectedAddons.includes(addon.id)
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <div>
                <p className="font-bold">{addon.label}</p>
                <p className="text-sm opacity-80">
                  {addon.type === 'percentage' ? `${addon.price * 100}% del total` : `$${addon.price.toFixed(2)} ${addon.type.replace('_', ' ')}`}
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${selectedAddons.includes(addon.id) ? 'bg-black border-black' : 'border-current'}`}/>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-gray-800/50 rounded-lg text-center">
          <p className="text-gray-400">Costo extra por add-ons:</p>
          <p className="text-4xl font-bold text-white">${addonsCost.toFixed(2)}</p>
        </div>
        
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        <div className="text-center mt-8">
          <PrimaryButton onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Ir al Resumen Final'}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}

export default function AddonsPage() {
    return (
        <Suspense fallback={<div className="bg-[#111827] h-screen text-white flex items-center justify-center">Cargando add-ons...</div>}>
            <AddonsContent />
        </Suspense>
    );
}