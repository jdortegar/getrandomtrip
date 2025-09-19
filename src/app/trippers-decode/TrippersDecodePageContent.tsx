'use client';

import { useSearchParams } from 'next/navigation';
import { TrippersDecodeSearch } from '@/components/landing/exploration/TrippersDecodeSearch';
import { TRIPPERS_DECODE_CONSTANTS } from '@/lib/data/constants/trippers-decode';

export function TrippersDecodePageContent() {
  const searchParams = useSearchParams();

  // Get search parameters from URL
  const destination = searchParams.get('destination') || '';
  const month = searchParams.get('month') || '';
  const searchQuery = searchParams.get('q') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="font-caveat text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {TRIPPERS_DECODE_CONSTANTS.TITLE}
            </h1>
            <p className="font-jost text-lg text-gray-600 max-w-3xl mx-auto">
              {TRIPPERS_DECODE_CONSTANTS.SUBTITLE}
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <TrippersDecodeSearch
            initialDestination={destination}
            initialMonth={month}
            initialQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
}
