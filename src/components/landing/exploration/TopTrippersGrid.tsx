'use client';

import React from 'react';
import TripperCard from '@/components/TripperCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface TopTrippersGridProps {
  trippers: Array<{
    id: string;
    name: string;
    tripperSlug: string | null;
    avatarUrl: string | null;
    bio: string | null;
    instagramUrl?: string | null;
  }>;
}

export function TopTrippersGrid({ trippers }: TopTrippersGridProps) {
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
        <Button asChild variant="feature" size="lg">
          <Link href="/trippers">EXPLORAR TRIPPERS</Link>
        </Button>
      </motion.div>
    </div>
  );
}
