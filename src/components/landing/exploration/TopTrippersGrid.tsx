'use client';

import React from 'react';
import TripperCard from '@/components/TripperCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface TopTrippersGridProps {
  buttonHref: string;
  buttonText: string;
  trippers: Array<{
    avatarUrl: string | null;
    bio: string | null;
    id: string;
    instagramUrl?: string | null;
    name: string;
    tripperSlug: string | null;
  }>;
}

export function TopTrippersGrid({
  buttonHref,
  buttonText,
  trippers,
}: TopTrippersGridProps) {
  const displayedTrippers = trippers
    .filter((tripper) => tripper.avatarUrl)
    .slice(0, 8);

  return (
    <div className="w-full">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {displayedTrippers.map((tripper) => (
          <TripperCard
            key={tripper.id}
            name={tripper.name}
            href={
              tripper.tripperSlug ||
              tripper.name.toLowerCase().replace(/\s+/g, '-')
            }
            className="h-full w-full"
            instagramUrl={tripper.instagramUrl ?? undefined}
            imageUrl={tripper.avatarUrl ?? '/images/fallback.jpg'}
          />
        ))}
      </motion.div>

      {/* CTA Button */}
      <motion.div
        className="mt-12 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Button asChild size="lg" variant="feature">
          <Link href={buttonHref}>{buttonText}</Link>
        </Button>
      </motion.div>
    </div>
  );
}
