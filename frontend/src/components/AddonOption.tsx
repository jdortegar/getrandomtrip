
// frontend/src/components/AddonOption.tsx
import React from 'react';

interface AddonOptionProps {
  id: string;
  title: string;
  description: string;
  price: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const AddonOption: React.FC<AddonOptionProps> = ({
  id,
  title,
  description,
  price,
  isSelected,
  onToggle,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
          : 'border-gray-300 bg-white hover:border-gray-100'
        }`}
      onClick={() => onToggle(id)}
    >
      <div>
        <h4 className="text-lg font-medium text-gray-800">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-lg font-semibold text-gray-700">+${price.toFixed(2)} USD</span>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(id)} // Handle toggle via checkbox directly as well
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
    </div>
  );
};

export default AddonOption;
