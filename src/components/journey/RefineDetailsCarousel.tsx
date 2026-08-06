"use client";

import React from "react";
import { motion } from "framer-motion";
import EmblaCarousel from "@/components/EmblaCarousel/EmblaCarousel";
import RefineDetailsCard from "@/components/journey/RefineDetailsCard";

interface RefineDetailsOption {
  desc: string;
  img: string;
  key: string;
  label: string;
}

interface RefineDetailsCarouselProps {
  itemsPerView?: 2 | 3 | 4;
  onSelect?: (optionKey: string) => void;
  options: RefineDetailsOption[];
  /** Attribution shown under the carousel — these card photos are hotlinked from Unsplash. */
  photoCreditLabel?: string;
  selectedOptions?: string[];
}

export function RefineDetailsCarousel({
  itemsPerView = 3,
  onSelect,
  options,
  photoCreditLabel,
  selectedOptions = [],
}: RefineDetailsCarouselProps) {
  const handleCardClick = (option: RefineDetailsOption) => {
    onSelect?.(option.key);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <EmblaCarousel
        slidesPerView={itemsPerView}
        wrapperClassName="px-0!"
        overflow="right"
      >
        {options.map((option, index) => {
          const isSelected = selectedOptions.includes(option.key);

          return (
            <RefineDetailsCard
              key={option.key}
              className="h-full w-full"
              description={option.desc}
              imageUrl={option.img}
              onClick={onSelect ? () => handleCardClick(option) : undefined}
              priority={index === 0}
              selected={isSelected}
              title={option.label}
            />
          );
        })}
      </EmblaCarousel>
      {photoCreditLabel ? (
        <p className="mt-2 text-right text-xs text-neutral-400">
          <a
            href="https://unsplash.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            {photoCreditLabel}
          </a>
        </p>
      ) : null}
    </motion.div>
  );
}
