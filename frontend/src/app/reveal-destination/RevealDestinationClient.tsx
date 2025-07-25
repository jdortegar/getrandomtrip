import React, { useState, useEffect } from 'react';
import PrimaryButton from '../../components/PrimaryButton';

export default function RevealDestinationClient() {
  const mockRevealTime = new Date(Date.now() + (10 * 1000)); // Reveal in 10 seconds for testing
  const mockBookingId = 'mock_booking_abcde';

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [destination, setDestination] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const revealTime = mockRevealTime.getTime();
      const remaining = revealTime - now;
      setTimeRemaining(remaining > 0 ? remaining : 0);

      if (remaining <= 0 && !isRevealed) {
        setIsRevealed(true);
        fetchDestination();
      }
    };

    const timer = setInterval(calculateTimeRemaining, 1000);
    calculateTimeRemaining(); // Initial calculation

    return () => clearInterval(timer);
  }, [isRevealed]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const fetchDestination = async () => {
    try {
      // In a real application, this would fetch the actual destination from the backend
      // For now, we'll simulate the call to /api/reveal and return mock data.
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
      const response = await fetch(`${backendUrl}/api/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: mockBookingId,
          destination: 'Kyoto, Japan', // This would ideally come from the backend
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDestination({
          name: data.destination || 'Kyoto, Japan',
          image: '/images/kyoto.jpg', // Placeholder image
          description: 'Discover ancient temples, beautiful gardens, and traditional geisha districts.',
          itinerary: [
            'Day 1: Arrive in Kyoto, check into ryokan, explore Gion district.',
            'Day 2: Visit Fushimi Inari Shrine and Arashiyama Bamboo Grove.',
            'Day 3: Explore Kinkaku-ji (Golden Pavilion) and Ryoan-ji (Zen garden).',
            'Day 4: Day trip to Nara to see Todai-ji Temple and deer park.',
          ],
        });
      } else {
        setError(data.message || 'Failed to fetch destination.');
      }
    } catch (err) {
      setError('Network error or server issue.');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">Error!</h1>
        <p className="text-xl text-gray-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      {!isRevealed ? (
        <>
          <h1 className="text-4xl font-bold mb-4 text-[#0A2240]">Your Adventure Awaits!</h1>
          <p className="text-xl text-gray-700 mb-8">Your destination will be revealed in:</p>
          <div className="text-6xl font-bold text-[#D97E4A] mb-8">
            {formatTime(timeRemaining)}
          </div>
          <p className="text-lg text-gray-600">Stay tuned for an unforgettable experience!</p>
        </>
      ) : (
        destination ? (
          <>
            <h1 className="text-4xl font-bold mb-4 text-[#0A2240]">Your Destination Revealed!</h1>
            <h2 className="text-3xl font-semibold mb-6 text-[#D97E4A]">{destination.name}</h2>

            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
              {/* Placeholder for Google Maps API */}
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
                Map Integration Placeholder
              </div>
              {/* <Image src={destination.image} alt={destination.name} layout="fill" objectFit="cover" /> */}
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md mb-8 text-left">
              <h3 className="text-2xl font-semibold mb-4 text-[#0A2240]">About Your Trip:</h3>
              <p className="text-gray-700 mb-6">{destination.description}</p>

              <h3 className="text-2xl font-semibold mb-4 text-[#0A2240]">Your Itinerary:</h3>
              <ul className="list-disc list-inside text-gray-700 ml-4">
                {destination.itinerary.map((item: string, index: number) => (
                  <li key={index} className="mb-2">{item}</li>
                ))}
              </ul>
            </div>

            <p className="text-xl text-gray-700 mb-8">Thank you for choosing Randomtrip for your next adventure!</p>

            <div className="flex justify-center space-x-4">
              <PrimaryButton onClick={() => console.log('Share experience')}>Share Your Experience</PrimaryButton>
              <PrimaryButton onClick={() => console.log('Book another trip')}>Book Another Trip</PrimaryButton>
            </div>
          </>
        ) : (
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-[#0A2240]">Fetching Destination...</h1>
            <p className="text-xl text-gray-700">Please wait while we reveal your surprise!</p>
          </div>
        )
      )}
    </div>
  );
}

