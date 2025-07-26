'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PrimaryButton from '../../components/PrimaryButton';
import SkeletonLoader from '../../components/SkeletonLoader';

interface DestinationData {
  name: string;
  image: string;
  description: string;
  itinerary: string[];
}

export default function RevealDestinationClient() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [destination, setDestination] = useState<DestinationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Placeholder for tripDate - in a real app, this would come from the booking details
  // For demonstration, let's set it to 5 minutes from now for testing the countdown
  const [tripDate, setTripDate] = useState<Date | null>(null);

  useEffect(() => {
    // In a real application, you would fetch the booking details here to get the actual tripDate
    // For now, we'll simulate fetching it or assume it's passed via props/context
    const fetchBookingDetails = async () => {
      // Simulate API call to get booking details and tripDate
      // const response = await fetch(`/api/booking/${bookingId}`);
      // const data = await response.json();
      // setTripDate(new Date(data.tripDate));

      // For testing, set a mock trip date (e.g., 5 minutes from now)
      const mockTripDate = new Date(Date.now() + (5 * 60 * 1000)); 
      setTripDate(mockTripDate);
      setLoading(false); // Stop initial loading once tripDate is set
    };

    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('Booking ID not found.');
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!tripDate) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const revealTime = tripDate.getTime() - (48 * 60 * 60 * 1000); // 48 hours before tripDate
      const remaining = revealTime - now;
      setTimeRemaining(remaining > 0 ? remaining : 0);

      if (remaining <= 0 && !isRevealed) {
        setIsRevealed(true);
        fetchDestination();
      }
    };

    const timer = setInterval(calculateTimeRemaining, 1000);
    calculateTimeRemaining(); // Initial calculation

    return () => {
      clearInterval(timer);
    };
  }, [tripDate, isRevealed]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const fetchDestination = async () => {
    setLoading(true); 
    if (!bookingId) {
      setError('Booking ID not found.');
      setLoading(false);
      return;
    }
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
      const response = await fetch(`${backendUrl}/api/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDestination({
          name: data.destination.name,
          image: data.destination.image || '/images/placeholder.jpg', 
          description: data.destination.description,
          itinerary: data.destination.itinerary,
        });
      } else {
        setError(data.message || 'Failed to fetch destination.');
      }
    } catch (e: any) {
      setError('Network error or server issue: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Preparing Your Reveal...</h1>
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

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

