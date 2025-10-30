import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export default function AvatarWithFallback({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  size = 'md',
}: AvatarWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const baseClasses = `rounded-full flex items-center justify-center bg-gray-200 text-gray-500 ${sizeClasses[size]} ${className}`;
  const fallbackClasses = `${baseClasses} ${fallbackClassName}`;

  if (!src || imageError) {
    return (
      <div className={fallbackClasses}>
        <User
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-12 h-12'}`}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${baseClasses} overflow-hidden`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
