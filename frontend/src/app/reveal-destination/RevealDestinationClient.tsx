'use client';

import React from 'react';
import PrimaryButton from '../../components/PrimaryButton';

export default function RevealDestinationClient() {
  // Mock data for demonstration
  const destination = {
    name: 'Kyoto, Japan',
    image: '/images/kyoto.jpg', // Placeholder image
    description: 'Discover ancient temples, beautiful gardens, and traditional geisha districts.',
    itinerary: [
      'Day 1: Arrive in Kyoto, check into ryokan, explore Gion district.',
      'Day 2: Visit Fushimi Inari Shrine and Arashiyama Bamboo Grove.',
      'Day 3: Explore Kinkaku-ji (Golden Pavilion) and Ryoan-ji (Zen garden).',
      'Day 4: Day trip to Nara to see Todai-ji Temple and deer park.',
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-4xl font-bold mb-4 text-[#0A2240]">Your Destination Awaits!</h1>
      <h2 className="text-3xl font-semibold mb-6 text-[#D97E4A]">{destination.name}</h2>

      <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
        {/* Placeholder for Google Maps API */}
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
          Map Integration Placeholder
        </div>
        {/* Example of how an image might be used */}
        {/* <Image src={destination.image} alt={destination.name} layout="fill" objectFit="cover" /> */}
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md mb-8 text-left">
        <h3 className="text-2xl font-semibold mb-4 text-[#0A2240]">About Your Trip:</h3>
        <p className="text-gray-700 mb-6">{destination.description}</p>

        <h3 className="text-2xl font-semibold mb-4 text-[#0A2240]">Your Itinerary:</h3>
        <ul className="list-disc list-inside text-gray-700 ml-4">
          {destination.itinerary.map((item, index) => (
            <li key={index} className="mb-2">{item}</li>
          ))}
        </ul>
      </div>

      <p className="text-xl text-gray-700 mb-8">Thank you for choosing Randomtrip for your next adventure!</p>

      <div className="flex justify-center space-x-4">
        <PrimaryButton onClick={() => console.log('Share experience')}>Share Your Experience</PrimaryButton>
        <PrimaryButton onClick={() => console.log('Book another trip')}>Book Another Trip</PrimaryButton>
      </div>
    </div>
  );
}
