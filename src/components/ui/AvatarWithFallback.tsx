import React, { useState } from "react";
import { User } from "lucide-react";
import Img from "@/components/common/Img";

interface AvatarWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const sizePixels = { sm: 32, md: 48, lg: 64, xl: 96 };

export default function AvatarWithFallback({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  size = "md",
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
      <div className={fallbackClasses} data-component="AvatarWithFallback">
        <User
          className={`${size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : size === "lg" ? "w-8 h-8" : "w-12 h-12"}`}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${baseClasses} overflow-hidden`} data-component="AvatarWithFallback">
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Img
        alt={alt}
        className={`w-full h-full object-cover ${imageLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        decoding="auto"
        height={sizePixels[size]}
        loading="eager"
        onError={handleImageError}
        // Keep native load timing; Next Image's onLoad waits for decode().
        onLoadCapture={handleImageLoad}
        src={src}
        unoptimized
        width={sizePixels[size]}
      />
    </div>
  );
}
