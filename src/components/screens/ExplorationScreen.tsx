'use client';

import React, { useState } from 'react';
import TravelerTypeCard from '../TravelerTypeCard';
import TripperCard from '../TripperCard';
import RoadtripCard from '../RoadtripCard';
import DecodeResultCard from '../DecodeResultCard';
import PrimaryButton from '../PrimaryButton';
import { useLanguage } from '@/context/LanguageContext';
import { TRIPPERS } from '@/content/trippers';

const tabs = ['By Traveller', 'Top Trippers', 'Roadtrips', 'Trippers Decode'];

const travellerTypes = [
  {
    type: 'couple',
    title: '¿Con quién vas a escribir tu próxima historia?',
    description: 'Escapadas románticas e inolvidables.',
    imageUrl: '/images/placeholder-couple.svg',
  },
  {
    type: 'solo',
    title: 'Viajar solo no es aburrido, es liberador',
    description: 'Descúbrete a ti mismo en un viaje único.',
    imageUrl: '/images/placeholder-solo.svg',
  },
  {
    type: 'family',
    title: '¿Hora de aventuras en familia?',
    description: 'Recuerdos para crear juntos.',
    imageUrl: '/images/placeholder-family.svg',
  },
  {
    type: 'group',
    title: 'Vive esos grandes momentos con amigos',
    description: 'La mejor experiencia para compartir.',
    imageUrl: '/images/placeholder-friends.svg',
  },
  {
    type: 'honeymoon',
    title: 'El comienzo perfecto para una vida juntos.',
    description: 'El comienzo perfecto para una vida juntos.',
    imageUrl: '/images/placeholder-honeymoon.svg',
  },
];

const roadtripTypes = [
  { type: 'Car', icon: '🚗', description: 'Libertad sobre ruedas.', bgImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf' },
  { type: 'Motorcycle', icon: '🏍️', description: 'Siente el camino y el viento.', bgImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc' },
  { type: 'Bike', icon: '🚲', description: 'Una aventura a tu propio ritmo.', bgImage: 'https://images.unsplash.com/photo-1471506480396-160b2734bf77' },
];

const decodeData = [
  { destination: 'Río Negro', month: 'Enero', bg: 'https://images.unsplash.com/photo-1621431213292-31434c898822', profileImg: 'https://i.pravatar.cc/150?u=ana', title: 'Río Negro Edition', author: 'Ana García' },
  { destination: 'Kyoto', month: 'Abril', bg: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d', profileImg: 'https://i.pravatar.cc/150?u=julian', title: 'Esencia de Kyoto', author: 'Julián Soto' },
];

const ExplorationScreen = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { t } = useLanguage();

  const handleSelect = (step: string) => {
    alert(`Navigating to ${step}`);
  };

  return (
    <div className="bg-[#0D0D0D] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('startYourJourney')}
          </h1>
          <p className="text-lg text-gray-400 mt-4 mb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
            {t('chooseHowToStart')}
          </p>
        </div>

        <div className="flex justify-center border-b border-gray-800 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 md:px-6 font-medium text-md md:text-lg focus:outline-none transition-colors duration-300 ${
                activeTab === tab ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-500 hover:text-white'
              }`}
            >
              {t(tab.replace(/\s+/g, ''))}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          {activeTab === 'By Traveller' && (
            <div>
              <p className="text-center text-gray-400 mb-8 italic">{t('byTravellerSubtitle')}</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {travellerTypes.map((type) => (
                  <TravelerTypeCard key={type.title} {...type} href={`/packages/${type.type}`} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Top Trippers' && (
            <div>
              <p className="text-center text-gray-400 mb-8 italic">{t('topTrippersSubtitle')}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4 items-start">
                {TRIPPERS.map((tripper) => (
                  <TripperCard
                    key={tripper.slug}
                    slug={tripper.slug}
                    name={tripper.name}
                    img={tripper.avatar}
                    bio={tripper.bio}
                    
                  />
                ))}

                {/* Interactive Search Card Placeholder */}
                <div className="flex flex-col items-center justify-center text-center p-6 h-full bg-gray-900/50 rounded-2xl border border-gray-800">
                  <h3 className="font-bold text-lg mb-2">{t('searchYourFavoriteTripper')}</h3>
                  <input
                    type="text"
                    placeholder={t('writeAName')}
                    className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <PrimaryButton onClick={() => {}} className="mt-2 w-full text-sm">
                    {t('search')}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Roadtrips' && (
            <div>
              <p className="text-center text-gray-400 mb-8 italic">{t('roadtripsSubtitle')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roadtripTypes.map((item) => (
                  <RoadtripCard
                    key={item.type}
                    title={item.type}
                    icon={item.icon}
                    description={item.description}
                    bgImage={item.bgImage}
                    onClick={() => handleSelect('Roadtrip Form')}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Trippers Decode' && (
            <div>
              <p className="text-center text-gray-400 mb-8 italic max-w-2xl mx-auto">{t('trippersDecodeSubtitle')}</p>
              <div className="flex flex-col md:flex-row items-center gap-2 bg-gray-900/50 p-4 rounded-lg max-w-2xl mx-auto border border-gray-800">
                <input
                  type="text"
                  placeholder={t('whereNext')}
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border-none outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <select className="w-full md:w-auto bg-gray-800 text-white p-3 rounded-lg border-none outline-none focus:ring-2 focus:ring-[#D4AF37]">
                  <option>{t('anyMonth')}</option>
                </select>
                <PrimaryButton onClick={() => {}}>{t('search')}</PrimaryButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {decodeData.map((item) => (
                  <DecodeResultCard key={item.title} item={item} onClick={() => handleSelect('Add-ons')} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorationScreen;