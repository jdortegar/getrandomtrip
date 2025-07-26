'use client';

import React, { useEffect, useState } from 'react';
import PrimaryButton from '../../components/PrimaryButton';
import SkeletonLoader from '../../components/SkeletonLoader';

interface BookingConfirmation {
  success: boolean;
  message: string;
  // Add other properties that might be returned by the API
}

export default function PostPurchaseClient() {
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfirmation = async () => {
      try {
        // In a real application, the bookingId would be passed via query params or context
        const mockBookingId = 'mock_booking_abcde'; // This should come from the checkout process
        const mockPaymentId = 'mock_transaction_12345'; // This should come from the checkout process

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
        const response = await fetch(`${backendUrl}/api/post-purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: mockBookingId,
            status: 'confirmed',
            paymentId: mockPaymentId,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setBookingConfirmation(data);
        } else {
          setError(data.message || 'Failed to fetch booking confirmation.');
        }
      } catch {
        setError('Network error or server issue.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmation();
  }, []);

  const handleRevealDestination = () => {
    console.log('Proceeding to destination reveal...');
    // TODO: Navigate to the destination reveal page, potentially passing bookingId
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Loading Confirmation...</h1>
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
        <p className="text-lg text-gray-600 mt-4">Please contact support if the issue persists.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-4xl font-bold mb-4 text-[#0A2240]">Thank You for Your Purchase!</h1>
      <p className="text-xl text-gray-700 mb-8">Your Randomtrip adventure is confirmed.</p>
      {bookingConfirmation && (
        <div className="bg-white p-6 rounded-lg shadow-md inline-block">
          <p className="text-lg text-gray-800"><strong>Status:</strong> {bookingConfirmation.message}</p>
          {/* Display other relevant confirmation details if available in the response */}
        </div>
      )}
      <div className="mt-8">
        <PrimaryButton onClick={handleRevealDestination}>
          Reveal My Destination!
        </PrimaryButton>
      </div>
    </div>
  );
}

