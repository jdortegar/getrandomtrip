'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PrimaryButton from '@/components/PrimaryButton';
import SkeletonLoader from '@/components/SkeletonLoader';


export default function BasicConfigClient() {
  const [originCity, setOriginCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [nights, setNights] = useState(1);
  const [travelers, setTravelers] = useState(1);
  const [accommodationType, setAccommodationType] = useState('');
  const [transportationType, setTransportationType] = useState('');
  const [loading, setLoading] = useState(true);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Simulate data fetching or heavy computation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Simulate 1.5 seconds loading time

    return () => clearTimeout(timer);
  }, []);

  const [googleMapsApiLoaded, setGoogleMapsApiLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleMapsApiLoaded(true);
        script.onerror = () => {
          console.error('Google Maps API failed to load.');
          setGoogleMapsApiLoaded(false);
        };
        document.head.appendChild(script);
      } else {
        setGoogleMapsApiLoaded(true);
      }
    };

    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    if (!loading && googleMapsApiLoaded && autocompleteInputRef.current) {
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(
          autocompleteInputRef.current,
          { types: ['(cities)'] }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setOriginCity(place.formatted_address);
          } else if (place.name) {
            setOriginCity(place.name);
          }
        });
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
        // Fallback to free-text input if Autocomplete fails
      }
    }
  }, [loading, googleMapsApiLoaded]);

  const router = useRouter();

  const handleContinue = () => {
    const currentConfig = {
      basicConfig: {
        originCity,
        travelDate,
        nights,
        travelers,
        accommodationType,
        transportationType,
      },
    };
    localStorage.setItem('tripConfig', JSON.stringify(currentConfig));
    router.push('/filters-premium');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Basic Services</h1>
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Basic Services</h1>

      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="originCity" className="block text-gray-700 text-sm font-bold mb-2">Origin City:</label>
            <input
              type="text"
              id="originCity"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., New York"
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              ref={autocompleteInputRef}
            />
          </div>
          <div>
            <label htmlFor="travelDate" className="block text-gray-700 text-sm font-bold mb-2">Travel Date:</label>
            <input
              type="date"
              id="travelDate"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="nights" className="block text-gray-700 text-sm font-bold mb-2">Number of Nights:</label>
            <input
              type="number"
              id="nights"
              min="1"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={nights}
              onChange={(e) => setNights(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="travelers" className="block text-gray-700 text-sm font-bold mb-2">Number of Travelers:</label>
            <input
              type="number"
              id="travelers"
              min="1"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={travelers}
              onChange={(e) => setTravelers(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-[#0A2240]">Accommodation Type:</h3>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-[#D97E4A]"
                name="accommodationType"
                value="hotel"
                checked={accommodationType === 'hotel'}
                onChange={(e) => setAccommodationType(e.target.value)}
              />
              <span className="ml-2 text-gray-700">Hotel</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-[#D97E4A]"
                name="accommodationType"
                value="hostel"
                checked={accommodationType === 'hostel'}
                onChange={(e) => setAccommodationType(e.target.value)}
              />
              <span className="ml-2 text-gray-700">Hostel</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-[#D97E4A]"
                name="accommodationType"
                value="glamping"
                checked={accommodationType === 'glamping'}
                onChange={(e) => setAccommodationType(e.target.value)}
              />
              <span className="ml-2 text-gray-700">Glamping</span>
            </label>
            {/* Add more accommodation types as needed */}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-[#0A2240]">Transportation Type:</h3>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-[#D97E4A]"
                name="transportationType"
                value="flights"
                checked={transportationType === 'flights'}
                onChange={(e) => setTransportationType(e.target.value)}
              />
              <span className="ml-2 text-gray-700">Flights</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-[#D97E4A]"
                name="transportationType"
                value="train"
                checked={transportationType === 'train'}
                onChange={(e) => setTransportationType(e.target.value)}
              />
              <span className="ml-2 text-gray-700">Train</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-[#D97E4A]"
                name="transportationType"
                value="bus"
                checked={transportationType === 'bus'}
                onChange={(e) => setTransportationType(e.target.value)}
              />
              <span className="ml-2 text-gray-700">Bus</span>
            </label>
            {/* Add more transportation types as needed */}
          </div>
        </div>

        <div className="text-center text-xl font-bold text-[#0A2240] mb-6">
          Base Price: $0.00 {/* Placeholder for dynamic price calculation */}
        </div>
      </div>

      <div className="text-center">
        <PrimaryButton onClick={handleContinue}>
          Proceed to Premium Filters
        </PrimaryButton>
      </div>
    </div>
  );
}


