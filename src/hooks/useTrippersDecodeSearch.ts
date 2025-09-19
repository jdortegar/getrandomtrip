'use client';

import { useState } from 'react';
import { initialDecodeData, type DecodeItem } from '@/lib/data/decodeData';
import { TRIPPERS_DECODE_CONSTANTS } from '@/lib/data/constants/trippers-decode';

// Placeholder for Kai Service
const getKaiSuggestion = async (destination: string, month: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (destination === TRIPPERS_DECODE_CONSTANTS.SEARCH.PLACEHOLDER) return '';
  return `¡Kai sugiere explorar ${destination} en ${month || 'cualquier mes'}! Podría ser una aventura inesperada llena de... ¡sorpresas!`;
};

interface UseTrippersDecodeSearchOptions {
  initialDestination?: string;
  initialMonth?: string;
  initialQuery?: string;
}

export function useTrippersDecodeSearch({
  initialDestination = '',
  initialMonth = '',
  initialQuery = '',
}: UseTrippersDecodeSearchOptions = {}) {
  const [destination, setDestination] = useState(initialDestination);
  const [month, setMonth] = useState(initialMonth);
  const [results, setResults] = useState<DecodeItem[]>([]);
  const [kaiSuggestion, setKaiSuggestion] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);

    // Create URL parameters
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (month.trim()) params.set('month', month.trim());

    // Redirect to trippers-decode page with parameters
    const queryString = params.toString();
    const url = queryString
      ? `/trippers-decode?${queryString}`
      : '/trippers-decode';

    // Use window.location for navigation to preserve the current page context
    window.location.href = url;

    setIsSearching(false);
  };

  const resetSearch = () => {
    setDestination('');
    setMonth('');
    setResults([]);
    setKaiSuggestion('');
    setHasSearched(false);
  };

  return {
    destination,
    month,
    results,
    kaiSuggestion,
    isSearching,
    hasSearched,
    setDestination,
    setMonth,
    handleSearch,
    resetSearch,
  };
}
