"use client";

import Image from "next/image";
import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefineDetailsCardProps {
  className?: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
  selected?: boolean;
  title: string;
}

export default function RefineDetailsCard({
  className,
  description,
  imageUrl,
  onClick,
  selected = false,
  title,
}: RefineDetailsCardProps) {
  return (
    <button
      className={cn(
        "group relative block duration-300 origin-center aspect-[293.95/347.82] w-full cursor-pointer text-left",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {selected && (
        <div className="absolute -right-[9.8px] top-0 z-30 @[250px]:-right-[14px]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172C36]">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}
      <div
        className={cn(
          "relative h-full w-full text-left overflow-hidden rounded-2xl transition-all duration-300 border-4 ",
          selected ? "border-[#172C36]" : "border-transparent",
        )}
      >
        <Image
          alt={title}
          className="transition-transform duration-300 group-hover:scale-110"
          fill
          priority
          src={imageUrl}
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/75 to-transparent" />

        {/* Card Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h3 className="font-barlow-condensed text-3xl @[300]:text-4xl font-extrabold uppercase leading-tight mb-4">
              {title}
            </h3>
            <p className="font-barlow text-base @[300px]:text-lg text-white/90 max-w-xs">
              {description}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
