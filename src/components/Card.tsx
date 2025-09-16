import React from 'react';

    interface CardProps {
      children: React.ReactNode;
      onClick?: () => void;
      className?: string;
    }

    const Card: React.FC<CardProps> = ({ children, onClick, className = '' }) => {
      return (
        <div
          onClick={onClick}
          className={`bg-gray-800/50 border border-gray-700 p-6 rounded-lg transition-all duration-300 hover:border-[#D4AF37] hover:bg-gray-800 ${
            onClick ? 'cursor-pointer' : ''
          } ${className}`}
        >
          {children}
        </div>
      );
    };