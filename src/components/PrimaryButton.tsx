import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      {...props}
      className={`bg-[#D97E4A] text-white font-bold uppercase tracking-wider py-3 px-8 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111827] focus:ring-[#D4AF37] disabled:opacity-50 disabled:scale-100 ${className}`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
