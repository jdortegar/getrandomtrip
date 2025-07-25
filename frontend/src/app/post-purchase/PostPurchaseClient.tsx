'use client';

import React from 'react';
import PrimaryButton from '../../components/PrimaryButton';

export default function PostPurchaseClient() {
  const handleRevealDestination = () => {
    console.log('Proceeding to destination reveal...');
    // TODO: Navigate to the destination reveal page
  };

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-4xl font-bold mb-4 text-[#0A2240]">Thank You for Your Purchase!</h1>
      <p className="text-xl text-gray-700 mb-8">Your Randomtrip adventure is confirmed.</p>
      <PrimaryButton onClick={handleRevealDestination}>
        Reveal My Destination!
      </PrimaryButton>
    </div>
  );
}
