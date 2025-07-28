'use client';
import React from 'react';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button onClick={onClick} className="relative py-2 px-6 transition-colors group">
      <span className={`text-lg uppercase tracking-wider ${isActive ? 'text-black' : 'text-gray-600 group-hover:text-gray-900'}`}>{label}</span>
      {isActive && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black" />
      )}
    </button>
  );
};

export default TabButton;