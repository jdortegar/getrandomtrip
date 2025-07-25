'use client';
import React from 'react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, onClick }) => {
  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
