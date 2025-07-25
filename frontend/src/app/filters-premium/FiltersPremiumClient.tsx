'use client';

import React, { useState } from 'react';
import PrimaryButton from '../../components/PrimaryButton';

interface FilterOption {
  id: string;
  name: string;
  description: string;
  price: number;
}

const premiumFilters: FilterOption[] = [
  {
    id: 'transport_type',
    name: 'Preferred Transport Type',
    description: 'Choose your preferred mode of transport.',
    price: 0, // First filter is free
  },
  {
    id: 'experience_type',
    name: 'Specific Experience Type',
    description: 'Tailor your trip to a specific experience (e.g., adventure, relaxation).',
    price: 50,
  },
  {
    id: 'climate_preference',
    name: 'Climate Preference',
    description: 'Select your ideal climate (e.g., tropical, snowy, temperate).',
    price: 30,
  },
  {
    id: 'avoid_destinations',
    name: 'Avoid Specific Destinations',
    description: 'Exclude places you\'ve already visited or don\'t wish to go.',
    price: 20,
  },
];

export default function FiltersPremiumClient() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const handleFilterChange = (filterId: string, price: number) => {
    setSelectedFilters((prevSelected) => {
      const newSelected = prevSelected.includes(filterId)
        ? prevSelected.filter((id) => id !== filterId)
        : [...prevSelected, filterId];

      // Calculate total price based on selected filters
      let currentPrice = 0;
      const sortedFilters = premiumFilters.filter(f => newSelected.includes(f.id)).sort((a, b) => a.price - b.price);

      sortedFilters.forEach((filter, index) => {
        if (index > 0) { // First filter is free
          currentPrice += filter.price;
        }
      });
      setTotalPrice(currentPrice);

      return newSelected;
    });
  };

  const handleContinue = () => {
    console.log('Continue to Add-ons with selected filters:', selectedFilters, 'Total Price:', totalPrice);
    // TODO: Navigate to the next step (Add-ons)
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Enhance Your Trip with Premium Filters</h1>

      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        {premiumFilters.map((filter) => (
          <div key={filter.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-[#D97E4A]"
                  checked={selectedFilters.includes(filter.id)}
                  onChange={() => handleFilterChange(filter.id, filter.price)}
                />
                <span className="ml-3 text-lg font-semibold text-[#0A2240]">{filter.name}</span>
              </label>
              <p className="text-gray-600 text-sm ml-8">{filter.description}</p>
            </div>
            <span className="text-lg font-bold text-[#D97E4A]">
              {filter.price === 0 ? 'Free' : `$${filter.price}`}
            </span>
          </div>
        ))}

        <div className="text-right mt-8">
          <p className="text-2xl font-bold text-[#0A2240]">Current Total Price: ${totalPrice.toFixed(2)}</p>
          <p className="text-sm text-gray-600">First premium filter is free.</p>
        </div>
      </div>

      <div className="text-center">
        <PrimaryButton onClick={handleContinue}>
          Continue to Add-ons
        </PrimaryButton>
      </div>
    </div>
  );
}
