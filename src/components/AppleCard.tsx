
// frontend/src/components/AppleCard.tsx
import React from 'react';

interface AppleCardProps {
  children: React.ReactNode;
  className?: string;
}

const AppleCard: React.FC<AppleCardProps> = ({ children, className }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 ${className || ''}`}
    >
      {children}
    </div>
  );
};

export default AppleCard;
