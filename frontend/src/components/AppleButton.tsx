
// frontend/src/components/AppleButton.tsx
import React from 'react';

interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const AppleButton: React.FC<AppleButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default AppleButton;
