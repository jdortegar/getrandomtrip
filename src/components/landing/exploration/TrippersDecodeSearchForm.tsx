'use client';

import React from 'react';
import { TRIPPERS_DECODE_CONSTANTS } from '@/lib/data/constants/trippers-decode';

interface TrippersDecodeSearchFormProps {
  destination: string;
  month: string;
  isSearching: boolean;
  onDestinationChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onSearch: () => void;
}

export function TrippersDecodeSearchForm({
  destination,
  month,
  isSearching,
  onDestinationChange,
  onMonthChange,
  onSearch,
}: TrippersDecodeSearchFormProps) {
  return (
    <div className="bg-gray-100 p-4 rounded-md max-w-4xl mx-auto mb-12 border border-gray-200">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <input
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          type="text"
          placeholder={TRIPPERS_DECODE_CONSTANTS.SEARCH.PLACEHOLDER}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="relative w-full md:w-auto">
          <select
            value={month}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onMonthChange(e.target.value)
            }
            className="min-w-[200px] flex h-10 w-full rounded-md border border-gray-200 bg-white pl-3 pr-8 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
          >
            <option value="">Cualquier Mes</option>
            {TRIPPERS_DECODE_CONSTANTS.MONTHS.map((monthOption: string) => (
              <option key={monthOption} value={monthOption}>
                {monthOption}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <button
          onClick={onSearch}
          disabled={isSearching}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full md:w-auto min-w-[140px]"
        >
          {isSearching
            ? 'Buscando...'
            : TRIPPERS_DECODE_CONSTANTS.SEARCH.BUTTON_TEXT}
        </button>
      </div>
    </div>
  );
}
