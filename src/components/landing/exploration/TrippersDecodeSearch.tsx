'use client';

import React from 'react';
import { useTrippersDecodeSearch } from '@/hooks/useTrippersDecodeSearch';
import { TrippersDecodeSearchForm } from './TrippersDecodeSearchForm';
import { TrippersDecodeResults } from './TrippersDecodeResults';
import { EXPLORATION_CONSTANTS } from './exploration.constants';

interface TrippersDecodeSearchProps {
  initialDestination?: string;
  initialMonth?: string;
  initialQuery?: string;
  showSubtitle?: boolean;
}

export function TrippersDecodeSearch({
  initialDestination = '',
  initialMonth = '',
  initialQuery = '',
  showSubtitle = true,
}: TrippersDecodeSearchProps) {
  const {
    destination,
    month,
    results,
    kaiSuggestion,
    isSearching,
    hasSearched,
    setDestination,
    setMonth,
    handleSearch,
  } = useTrippersDecodeSearch({
    initialDestination,
    initialMonth,
    initialQuery,
  });

  return (
    <div className="py-8">
      {showSubtitle && (
        <p className="text-center text-gray-600 mb-12 italic font-jost text-lg max-w-2xl mx-auto">
          {EXPLORATION_CONSTANTS.TAB_DESCRIPTIONS['Trippers Decode']}
        </p>
      )}

      <TrippersDecodeSearchForm
        destination={destination}
        month={month}
        isSearching={isSearching}
        onDestinationChange={setDestination}
        onMonthChange={setMonth}
        onSearch={handleSearch}
      />

      <TrippersDecodeResults
        results={results}
        kaiSuggestion={kaiSuggestion}
        hasSearched={hasSearched}
        isSearching={isSearching}
      />
    </div>
  );
}
