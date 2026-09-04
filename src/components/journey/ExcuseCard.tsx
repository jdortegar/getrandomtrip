"use client";

import React, { useEffect, useState } from "react";
import Img from "@/components/common/Img";
import { getTopicImage } from "@/lib/api/unsplash";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Check } from "lucide-react";

interface ExcuseCardProps {
  className?: string;
  ctaLabel?: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
  priority?: boolean;
  selected?: boolean;
  title: string;
}

export default function ExcuseCard({
  className,
  ctaLabel = "Elegir y continuar",
  description,
  imageUrl,
  onClick,
  priority = false,
  selected = false,
  title,
}: ExcuseCardProps) {
  const [src, setSrc] = useState(imageUrl);

  useEffect(() => {
    setSrc(imageUrl);
  }, [imageUrl]);

  const handleImageError = () => {
    void getTopicImage(title).then((found) => {
      if (found) setSrc(found);
    });
  };

  return (
    <button
      className={cn(
        "@container group relative block origin-center aspect-[293.95/347.82] w-full py-3 cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {selected && (
        <div className="absolute right-[-9.8px] top-0 z-30 @[250px]:right-[-14px]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}
      <div
        className={cn(
          "relative h-full w-full text-left overflow-hidden rounded-2xl transition-all duration-300 border-4 ",
          selected ? "border-primary" : "border-transparent",
        )}
      >
        <Img
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          height={348}
          onError={handleImageError}
          priority={priority}
          src={src}
          width={294}
        />
        <div className="absolute inset-0 z-10 rounded-2xl bg-linear-to-t from-black/75 to-transparent" />

        {/* Card Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="flex-1 flex flex-col items-center justify-center mb-4">
            <h3 className="font-barlow-condensed text-2xl font-extrabold uppercase leading-tight mb-4 @[300px]:text-3xl">
              {title}
            </h3>
            <p className="font-barlow text-sm @[300px]:text-lg text-white/90 max-w-xs hidden @[200px]:block">
              {description}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className="py-1"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </button>
  );
}
