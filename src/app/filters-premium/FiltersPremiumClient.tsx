'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrimaryButton from '../../components/PrimaryButton';
import SkeletonLoader from '../../components/SkeletonLoader';

interface FilterOption {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function FiltersPremiumClient() {
  const [premiumFilters, setPremiumFilters] = useState<FilterOption[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPremiumFilters = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/premium-filters`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: FilterOption[] = await response.json();
        setPremiumFilters(data);
      } catch (e: unknown) {
        // Error is not currently displayed to the user, so we just log it
        console.error('Error fetching premium filters:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumFilters();
  }, []);

  useEffect(() => {
    if (premiumFilters.length > 0) {
      let currentPrice = 0;
      const sortedFilters = premiumFilters.filter(f => selectedFilters.includes(f.id)).sort((a, b) => a.price - b.price);

      sortedFilters.forEach((filter, index) => {
        if (index > 0) { // First filter is free
          currentPrice += filter.price;
        }
      });
      setTotalPrice(currentPrice);
    }
  }, [selectedFilters, premiumFilters]);

  const handleFilterChange = (filterId: string) => {
    setSelectedFilters((prevSelected) => {
      const newSelected = prevSelected.includes(filterId)
        ? prevSelected.filter((id) => id !== filterId)
        : [...prevSelected, filterId];
      return newSelected;
    });
  };

  const router = useRouter();

  const handleContinue = () => {
    const storedConfig = localStorage.getItem('tripConfig');
    const tripConfig = storedConfig ? JSON.parse(storedConfig) : {};
    const updatedConfig = {
      ...tripConfig,
      premiumFilters: selectedFilters,
      premiumFilterCost: totalPrice,
    };
    localStorage.setItem('tripConfig', JSON.stringify(updatedConfig));
    router.push('/add-ons');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Enhance Your Trip with Premium Filters</h1>
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="premium-root" className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-[#0A2240]">Enhance Your Trip with Premium Filters</h1>

      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        {premiumFilters.map((filter) => (
          <div key={filter.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  data-testid={`premium-${filter.id}`}
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-[#D97E4A]"
                  checked={selectedFilters.includes(filter.id)}
                  onChange={() => handleFilterChange(filter.id)}
                />
                <span className="ml-3 text-lg font-semibold text-[#0A2240]">{filter.name}</span>
              </label>
              <p className="text-gray-600 text-sm ml-8">{filter.description}</p>
            </div>
            <span className="text-lg font-bold text-[#D97E4A]">
              {filter.price === 0 ? 'Free' : `${filter.price}`}
            </span>
          </div>
        ))}

        <div className="text-right mt-8">
          <p data-testid="premium-total" className="text-2xl font-bold text-[#0A2240]">Current Total Price: ${totalPrice.toFixed(2)}</p>
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