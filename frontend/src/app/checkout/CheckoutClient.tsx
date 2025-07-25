'use client';

import React, { useState, useEffect } from 'react';
import PrimaryButton from '../../components/PrimaryButton';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import SkeletonLoader from '../../components/SkeletonLoader';

interface TripSummary {
  experienceLevel: string;
  basicConfig: {
    originCity: string;
    travelDate: string;
    nights: number;
    travelers: number;
    accommodationType: string;
    transportationType: string;
  };
  premiumFilters: string[];
  addOns: string[];
  basePrice: number;
  premiumFilterCost: number;
  addOnsCost: number;
  totalPrice: number;
}

// Mock data for demonstration. In a real app, this would come from context/API.
const mockTripSummary: TripSummary = {
  experienceLevel: 'Explora+',
  basicConfig: {
    originCity: 'Buenos Aires',
    travelDate: '2025-08-15',
    nights: 7,
    travelers: 2,
    accommodationType: 'hotel',
    transportationType: 'flights',
  },
  premiumFilters: ['Specific Experience Type', 'Climate Preference'],
  addOns: ['Travel Insurance', 'Airport Transfer'],
  basePrice: 1200,
  premiumFilterCost: 80, // Example: 50 + 30
  addOnsCost: 130, // Example: (25+40) * 2 travelers
  totalPrice: 1410,
};

export default function CheckoutClient() {
  const [tripSummary] = useState<TripSummary>(mockTripSummary);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const router = useRouter();

  useEffect(() => {
    // Simulate data fetching or heavy computation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Simulate 1.5 seconds loading time

    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (section: string) => {
    console.log(`Editing section: ${section}`);
    // In a real application, this would navigate back to the relevant configuration step.
  };

  const handlePayNow = async () => {
    setPaymentStatus('processing');
    setErrorMessage(null); // Clear previous errors
    console.log('Simulating payment...');

    // Basic client-side validation
    if (tripSummary.totalPrice <= 0) {
      setErrorMessage('Total price must be greater than 0.');
      setPaymentStatus('failed');
      return;
    }

    // Simulate an API call
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
      const response = await fetch(`${backendUrl}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: tripSummary.totalPrice,
          currency: 'USD', // Assuming USD as default currency
          token: 'mock_payment_token', // This would come from a real payment gateway
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus('success');
        toast.success('Payment successful! Redirecting...');
        router.push('/post-purchase');
      } else {
        setPaymentStatus('failed');
        const msg = data.message || 'Payment failed. Please try again.';
        setErrorMessage(msg);
        toast.error(msg);
        console.error('Payment failed:', data.message || 'Unknown error');
      }
    } catch (error) {
      setPaymentStatus('failed');
      const msg = 'Network error or server issue. Please check your connection.';
      setErrorMessage(msg);
      toast.error(msg);
      console.error('Payment error:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Review Your Trip & Payment</h1>
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Review Your Trip & Payment</h1>

      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        {/* Trip Summary Section */}
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-[#0A2240]">Your Trip Details</h2>

          <div className="mb-4 border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-medium text-[#0A2240]">Experience Level:</h3>
              <span className="text-lg text-gray-700">{tripSummary.experienceLevel}</span>
              <button onClick={() => handleEdit('experienceLevel')} className="text-[#D97E4A] hover:underline text-sm">Edit</button>
            </div>
          </div>

          <div className="mb-4 border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-medium text-[#0A2240]">Basic Configuration:</h3>
              <button onClick={() => handleEdit('basicConfig')} className="text-[#D97E4A] hover:underline text-sm">Edit</button>
            </div>
            <ul className="list-disc list-inside text-gray-700 ml-4">
              <li>Origin City: {tripSummary.basicConfig.originCity}</li>
              <li>Travel Date: {tripSummary.basicConfig.travelDate}</li>
              <li>Nights: {tripSummary.basicConfig.nights}</li>
              <li>Travelers: {tripSummary.basicConfig.travelers}</li>
              <li>Accommodation: {tripSummary.basicConfig.accommodationType}</li>
              <li>Transportation: {tripSummary.basicConfig.transportationType}</li>
            </ul>
          </div>

          <div className="mb-4 border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-medium text-[#0A2240]">Premium Filters:</h3>
              <button onClick={() => handleEdit('premiumFilters')} className="text-[#D97E4A] hover:underline text-sm">Edit</button>
            </div>
            <ul className="list-disc list-inside text-gray-700 ml-4">
              {tripSummary.premiumFilters.length > 0 ? (
                tripSummary.premiumFilters.map((filter, index) => <li key={index}>{filter}</li>)
              ) : (
                <li>None selected</li>
              )}
            </ul>
          </div>

          <div className="mb-4 border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-medium text-[#0A2240]">Add-ons:</h3>
              <button onClick={() => handleEdit('addOns')} className="text-[#D97E4A] hover:underline text-sm">Edit</button>
            </div>
            <ul className="list-disc list-inside text-gray-700 ml-4">
              {tripSummary.addOns.length > 0 ? (
                tripSummary.addOns.map((addOn, index) => <li key={index}>{addOn}</li>)
              ) : (
                <li>None selected</li>
              )}
            </ul>
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="mb-6 text-right">
          <h2 className="text-2xl font-semibold mb-4 text-[#0A2240]">Price Breakdown</h2>
          <p className="text-lg text-gray-700">Base Price: ${tripSummary.basePrice.toFixed(2)}</p>
          <p className="text-lg text-gray-700">Premium Filters Cost: ${tripSummary.premiumFilterCost.toFixed(2)}</p>
          <p className="text-lg text-gray-700">Add-ons Cost: ${tripSummary.addOnsCost.toFixed(2)}</p>
          <p className="text-3xl font-bold text-[#0A2240] mt-4">Total Price: ${tripSummary.totalPrice.toFixed(2)}</p>
        </section>

        {/* Payment Section */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-[#0A2240]">Payment</h2>
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <p className="text-gray-700 mb-4">Placeholder for Mercado Pago integration.</p>
            {paymentStatus === 'processing' && (
              <p className="text-blue-600 font-semibold">Processing payment...</p>
            )}
            {paymentStatus === 'success' && (
              <p className="text-green-600 font-semibold">Payment Successful! Redirecting...</p>
            )}
            {paymentStatus === 'failed' && errorMessage && (
              <p className="text-red-600 font-semibold mb-2">{errorMessage}</p>
            )}
            <PrimaryButton onClick={handlePayNow} disabled={paymentStatus === 'processing'}>
              {paymentStatus === 'processing' ? 'Processing...' : 'Pay Now'}
            </PrimaryButton>
          </div>
        </section>
      </div>
    </div>
  );
}




  
