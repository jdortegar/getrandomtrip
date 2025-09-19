'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
        <Input
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          type="text"
          placeholder={TRIPPERS_DECODE_CONSTANTS.SEARCH.PLACEHOLDER}
          className="w-full"
        />

        <Select
          value={month}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onMonthChange(e.target.value)
          }
          className="w-full md:w-auto"
          placeholder="Cualquier Mes"
        >
          <option value="">Cualquier Mes</option>
          {TRIPPERS_DECODE_CONSTANTS.MONTHS.map((monthOption: string) => (
            <option key={monthOption} value={monthOption}>
              {monthOption}
            </option>
          ))}
        </Select>

        <Button
          onClick={onSearch}
          disabled={isSearching}
          size="lg"
          className="w-full md:w-auto min-w-[140px]"
        >
          {isSearching
            ? 'Buscando...'
            : TRIPPERS_DECODE_CONSTANTS.SEARCH.BUTTON_TEXT}
        </Button>
      </div>
    </div>
  );
}
