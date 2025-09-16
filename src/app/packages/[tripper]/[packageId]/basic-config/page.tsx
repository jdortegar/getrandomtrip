'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJsApiLoader } from '@react-google-maps/api';
import { premiumPackages } from '@/lib/premiumPackages';
import AppleCard from '@/components/AppleCard';
import AppleButton from '@/components/AppleButton';
import DatePicker from '@/components/DatePicker';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';

const libraries: ["places"] = ['places'];

const packageThemes = {
  essenza: {
    color: '#D4AF37',
    pageBg: 'bg-gray-900',
    cardBg: 'bg-black',
    textColor: 'text-white',
    inputBg: 'bg-gray-800',
    inputTextColor: 'text-white',
    buttonClass: 'apple-button-gold',
  },
  'modo-explora': {
    color: '#3B82F6',
    pageBg: 'bg-blue-50',
    cardBg: 'bg-white',
    textColor: 'text-gray-800',
    inputBg: 'bg-white',
    inputTextColor: 'text-gray-900',
    buttonClass: 'apple-button-blue',
  },
  'explora-plus': {
    color: '#10B981',
    pageBg: 'bg-green-50',
    cardBg: 'bg-white',
    textColor: 'text-gray-800',
    inputBg: 'bg-white',
    inputTextColor: 'text-gray-900',
    buttonClass: 'apple-button-green',
  },
  bivouac: {
    color: '#F59E0B',
    pageBg: 'bg-amber-50',
    cardBg: 'bg-white',
    textColor: 'text-gray-800',
    inputBg: 'bg-white',
    inputTextColor: 'text-gray-900',
    buttonClass: 'apple-button-amber',
  },
  'atelier-getaway': {
    color: '#6D28D9',
    pageBg: 'bg-violet-50',
    cardBg: 'bg-white',
    textColor: 'text-gray-800',
    inputBg: 'bg-white',
    inputTextColor: 'text-gray-900',
    buttonClass: 'apple-button-violet',
  },
  default: {
    color: '#6B7280',
    pageBg: 'bg-gray-100',
    cardBg: 'bg-white',
    textColor: 'text-gray-800',
    inputBg: 'bg-gray-50',
    inputTextColor: 'text-gray-900',
    buttonClass: 'apple-button-gray',
  }
};

const BasicConfigPage = () => {
  const { travelType, packageId } = useParams();
  const router = useRouter();

  const [origin, setOrigin] = useState('');
  const [startDate, setStartDate] = useState('');
  const [travelers, setTravelers] = useState(1);

  const pkg = premiumPackages.find((p) => p.id === packageId);
  const theme = packageThemes[packageId as keyof typeof packageThemes] || packageThemes.default;
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey,
    libraries,
  });

  useEffect(() => {
    if (!pkg) {
      router.push(`/packages/${travelType}`);
    }
  }, [pkg, router, travelType]);

  if (!pkg) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/packages/${travelType}/${packageId}/filters`);
  };

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${theme.pageBg}`}>
      <div className="max-w-3xl mx-auto">
        <h1 className={`text-4xl font-bold text-center mb-2 ${theme.textColor}`}>
          {pkg.title}
        </h1>
        <p className={`text-xl text-center mb-10 ${theme.textColor}`}>
          {pkg.tagline}
        </p>

        <AppleCard className={theme.cardBg}>
          <h2 className={`text-2xl font-semibold mb-6 ${theme.textColor}`}>Configuración Básica</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <GooglePlacesAutocomplete
              label="País y Ciudad de origen"
              value={origin}
              onChange={setOrigin}
              placeholder="País/Ciudad"
              required
              inputClassName={`${theme.inputBg} ${theme.inputTextColor}`}
              isLoaded={isLoaded}
            />
            <DatePicker
              label="Fecha de inicio"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              inputClassName={`${theme.inputBg} ${theme.inputTextColor}`}
            />
            <div>
              <label className={`block text-sm font-medium mb-1 ${theme.textColor}`}>Duración</label>
              <p className={`mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-base ${theme.inputBg} ${theme.inputTextColor}`}>
                {pkg.nights} noches
              </p>
            </div>
            <div>
              <label htmlFor="travelers" className={`block text-sm font-medium mb-1 ${theme.textColor}`}>Nº de viajeros</label>
              <select
                id="travelers"
                value={travelers}
                onChange={(e) => setTravelers(parseInt(e.target.value))}
                required
                className={`mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base ${theme.inputBg} ${theme.inputTextColor}`}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <AppleButton type="submit" className={theme.buttonClass}>Continuar</AppleButton>
          </form>
        </AppleCard>
      </div>
    </div>
  );
};

export default BasicConfigPage;