
// frontend/src/components/FilterOptionCard.tsx
import React from 'react';

interface FilterOptionCardProps {
  title: string;
  isSelected: boolean;
  onSelect: () => void;
  price?: number; // Optional price per filter
}

const FilterOptionCard: React.FC<FilterOptionCardProps> = ({
  title,
  isSelected,
  onSelect,
  price,
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
          : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      onClick={onSelect}
    >
      <h4 className="text-lg font-medium text-gray-800 text-center">{title}</h4>
      {price !== undefined && price > 0 && (
        <p className="text-sm text-gray-500 mt-1">+${price} USD</p>
      )}
      {isSelected && (
        <div className="absolute top-2 right-2 text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default FilterOptionCard;
