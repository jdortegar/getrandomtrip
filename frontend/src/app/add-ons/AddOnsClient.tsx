'use client';

import React, { useState, useEffect } from 'react';
import PrimaryButton from '../../components/PrimaryButton';
import SkeletonLoader from '../../components/SkeletonLoader';

interface AddOn {
  id: string;
  name: string;
  description: string;
  pricePerPerson: number;
  quantity?: number;
  selected: boolean;
}

const initialAddOns: AddOn[] = [
  {
    id: 'travel_insurance',
    name: 'Travel Insurance',
    description: 'Comprehensive coverage for your trip.',
    pricePerPerson: 25,
    selected: false,
  },
  {
    id: 'airport_transfer',
    name: 'Airport Transfer',
    description: 'Hassle-free transportation to and from the airport.',
    pricePerPerson: 40,
    selected: false,
  },
  {
    id: 'excursion_package',
    name: 'Excursion Package',
    description: 'Curated local tours and activities.',
    pricePerPerson: 75,
    selected: false,
  },
  {
    id: 'premium_dining',
    name: 'Premium Dining Experience',
    description: 'Access to exclusive restaurants and culinary tours.',
    pricePerPerson: 100,
    selected: false,
  },
];

export default function AddOnsClient() {
  const [addOns, setAddOns] = useState<AddOn[]>(initialAddOns);
  const [numberOfTravelers, setNumberOfTravelers] = useState(1); // Assuming this comes from a previous step
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching or heavy computation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Simulate 1.5 seconds loading time

    return () => clearTimeout(timer);
  }, []);

  const handleAddOnToggle = (id: string) => {
    setAddOns((prevAddOns) =>
      prevAddOns.map((addOn) =>
        addOn.id === id ? { ...addOn, selected: !addOn.selected } : addOn
      )
    );
  };

  const calculateCosts = () => {
    let totalExtraCostPerPerson = 0;
    let totalExtraCost = 0;

    addOns.forEach((addOn) => {
      if (addOn.selected) {
        totalExtraCostPerPerson += addOn.pricePerPerson;
      }
    });

    totalExtraCost = totalExtraCostPerPerson * numberOfTravelers;

    return { totalExtraCostPerPerson, totalExtraCost };
  };

  const { totalExtraCostPerPerson, totalExtraCost } = calculateCosts();

  const handleReviewAndPay = () => {
    console.log('Review and Pay with selected add-ons:', addOns.filter(ao => ao.selected));
    console.log('Total Extra Cost:', totalExtraCost);
    // TODO: Navigate to the next step (Review and Pay)
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Customize with Add-ons</h1>
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Customize with Add-ons</h1>

      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="mb-6">
          <label htmlFor="travelers" className="block text-gray-700 text-sm font-bold mb-2">Number of Travelers:</label>
          <input
            type="number"
            id="travelers"
            min="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={numberOfTravelers}
            onChange={(e) => setNumberOfTravelers(parseInt(e.target.value))}
          />
        </div>

        {addOns.map((addOn) => (
          <div key={addOn.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-[#D97E4A]"
                  checked={addOn.selected}
                  onChange={() => handleAddOnToggle(addOn.id)}
                />
                <span className="ml-3 text-lg font-semibold text-[#0A2240]">{addOn.name}</span>
              </label>
              <p className="text-gray-600 text-sm ml-8">{addOn.description}</p>
            </div>
            <span className="text-lg font-bold text-[#D97E4A]">
              +${addOn.pricePerPerson} / person
            </span>
          </div>
        ))}

        <div className="text-right mt-8">
          <p className="text-xl font-bold text-[#0A2240]">Extra Cost Per Person: ${totalExtraCostPerPerson.toFixed(2)}</p>
          <p className="text-2xl font-bold text-[#0A2240]">Total Extra Cost: ${totalExtraCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="text-center">
        <PrimaryButton onClick={handleReviewAndPay}>
          Review and Pay
        </PrimaryButton>
      </div>
    </div>
  );
}
