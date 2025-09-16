'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TabButton from '@/components/TabButton';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import TripperCard from '@/components/TripperCard';
import RoadtripCard from '@/components/RoadtripCard';
import DecodeResultCard from '@/components/DecodeResultCard';

export const dynamic = 'force-dynamic';

// --- Data for each tab ---
const travellerTypes = [
    { title: '¿Con quién vas a escribir tu próxima historia?', description: 'Escapadas románticas e inolvidables.', imageUrl: 'https://images.unsplash.com/photo-1542372147-9d1e82e67b63' },
    { title: 'Viajar solo no es aburrido, es liberador', description: 'Descúbrete a ti mismo en un viaje único.', imageUrl: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b' },
    { title: '¿Hora de aventuras en familia?', description: 'Recuerdos para crear juntos.', imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300' },
    { title: 'Vive esos grandes momentos con amigos', description: 'La mejor experiencia para compartir.', imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1' },
    { title: 'Honeymoon', description: 'El comienzo perfecto para una vida juntos.', imageUrl: 'https://unsplash.com/photo-1523438097201-512c7e5e5443' },
];
const topTrippersData = [
    { img: 'https://i.pravatar.cc/150?u=ana', name: 'Ana García' },
    { img: 'https://i.pravatar.cc/150?u=martin', name: 'Martín López' },
    { img: 'https://i.pravatar.cc/150?u=camila', name: 'Camila Ruiz' },
    { img: 'https://i.pravatar.cc/150?u=julian', name: 'Julián Soto' },
    { img: 'https://i.pravatar.cc/150?u=valentina', name: 'Valentina Díaz' }
];
const roadtripTypes = [
    { type: 'Car', icon: 'car-icon', description: 'Libertad sobre ruedas.', bgImage: 'https://source.unsplash.com/random/800x600?road,car' },
    { type: 'Motorcycle', icon: 'motorcycle-icon', description: 'Siente el camino y el viento.', bgImage: 'https://source.unsplash.com/random/800x600?road,motorcycle' },
    { type: 'Bike', icon: 'bike-icon', description: 'Una aventura a tu propio ritmo.', bgImage: 'https://source.unsplash.com/random/800x600?road,bike' },
];
const decodeData = [
    { destination: 'Río Negro', month: 'Enero', bg: 'https://source.unsplash.com/random/800x600?patagonia', profileImg: 'https://i.pravatar.cc/150?u=ana', title: 'Río Negro Edition', author: 'Ana García' },
    { destination: 'Kyoto', month: 'Abril', bg: 'https://source.unsplash.com/random/800x600?kyoto', profileImg: 'https://i.pravatar.cc/150?u=julian', title: 'Esencia de Kyoto', author: 'Julián Soto' },
];


function ExplorationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  
  const [activeTab, setActiveTab] = useState('By Traveller');

  const handleSelect = () => {
    if (!bookingId) return;
    router.push(`/journey/experience-level?bookingId=${bookingId}`);
  };

  return (
    <main className="bg-[#0D0D0D] text-white min-h-screen p-8 md:p-16">
      <div className="max-w-7xl mx-auto text-center">
        <h1>🚨 TEST NUEVO 🚨</h1>
        <p className="text-lg text-gray-300 mt-4 mb-12" style={{ fontFamily: 'Inter, sans-serif' }}>Elige cómo quieres empezar a dar forma a tu aventura.</p>

        <div className="flex justify-center space-x-4 md:space-x-8 border-b border-gray-700 mb-12">
          <TabButton label="By Traveller" isActive={activeTab === 'By Traveller'} onClick={() => setActiveTab('By Traveller')} />
          <TabButton label="Top Trippers" isActive={activeTab === 'Top Trippers'} onClick={() => setActiveTab('Top Trippers')} />
          <TabButton label="Roadtrips" isActive={activeTab === 'Roadtrips'} onClick={() => setActiveTab('Roadtrips')} />
          <TabButton label="Trippers Decode" isActive={activeTab === 'Trippers Decode'} onClick={() => setActiveTab('Trippers Decode')} />
        </div>

        <div className="animate-fade-in">
          {activeTab === 'By Traveller' && (
            <div>
              <p className="text-center text-gray-400 mb-8 italic">¿Con quién vas a escribir tu próxima historia?</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {travellerTypes.map((type) => (
                  <TravelerTypeCard key={type.title} {...type} />
                ))}
              </div>
            </div>
          )}
          {activeTab === 'Top Trippers' && (
            <div>
              <p className="text-center text-gray-400 mb-8 italic">Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                {topTrippersData.map(tripper => <TripperCard key={tripper.name} {...tripper} onClick={handleSelect} />)}
              </div>
            </div>
          )}
          {activeTab === 'Roadtrips' && (
            <div>
              <p className="text-center text-gray-400 mb-8 italic">Libertad sobre ruedas. Tú eliges el ritmo.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {roadtripTypes.map(item => <RoadtripCard key={item.type} title={item.type} icon={item.icon} description={item.description} bgImage={item.bgImage} onClick={handleSelect} />)}
              </div>
            </div>
          )}
          {activeTab === 'Trippers Decode' && (
            <div>
               <p className="text-center text-gray-400 mb-8 italic max-w-2xl mx-auto">Rutas con alma, contadas por quienes las vivieron.</p>
               <p className="text-gray-500">Buscador de Trippers Decode por implementar.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ExplorationPage() {
    return (
        <Suspense fallback={<div className="bg-[#0D0D0D] h-screen text-white flex items-center justify-center">Cargando...</div>}>
            <ExplorationPageContent />
        </Suspense>
    );
}