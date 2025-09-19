'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DecodeResultCard from '@/components/DecodeResultCard';
import { initialDecodeData, type DecodeItem } from '@/lib/data/decodeData';
import { TRIPPERS_DECODE_CONSTANTS } from '@/lib/data/constants/trippers-decode';

interface TrippersDecodeResultsProps {
  results: DecodeItem[];
  kaiSuggestion: string;
  hasSearched: boolean;
  isSearching: boolean;
}

export function TrippersDecodeResults({
  results,
  kaiSuggestion,
  hasSearched,
  isSearching,
}: TrippersDecodeResultsProps) {
  const router = useRouter();

  if (!hasSearched && !isSearching) {
    return null;
  }

  return (
    <div className="mt-12">
      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {initialDecodeData.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
              delay: index * 0.1,
            }}
          >
            <DecodeResultCard
              item={item}
              onClick={() => router.push('/packages/build/add-ons')}
            />
          </motion.div>
        ))}
      </div>

      {/* Kai Suggestion */}
      {kaiSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 text-center"
        >
          <span className="text-5xl mb-4 block">
            {TRIPPERS_DECODE_CONSTANTS.KAI.EMOJI}
          </span>
          <h4 className="font-caveat text-3xl text-primary font-bold mb-4">
            {TRIPPERS_DECODE_CONSTANTS.KAI.TITLE}
          </h4>
          <p className="font-jost text-lg text-gray-700 italic leading-relaxed">
            {kaiSuggestion}
          </p>
        </motion.div>
      )}

      {/* No Results Message */}
      {results.length === 0 &&
        !kaiSuggestion &&
        hasSearched &&
        !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-12"
          >
            <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-4xl mb-4">🔍</div>
              <p className="font-jost text-gray-600 text-lg">
                {TRIPPERS_DECODE_CONSTANTS.SEARCH.NO_RESULTS_TEXT}
              </p>
            </div>
          </motion.div>
        )}
    </div>
  );
}
