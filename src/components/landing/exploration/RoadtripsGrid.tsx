'use client';

import React from 'react';
import { motion } from 'framer-motion';
import RoadtripCard from '@/components/RoadtripCard';
import { initialRoadtripTypes } from '@/lib/data/roadtripTypes';
import { EXPLORATION_CONSTANTS } from './exploration.constants';

export function RoadtripsGrid() {
  return (
    <div className="py-8">
      <p className="text-center text-gray-600 mb-8 italic font-jost text-lg">
        {EXPLORATION_CONSTANTS.TAB_DESCRIPTIONS['Roadtrips']}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {initialRoadtripTypes.map((item) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <RoadtripCard
              title={item.type}
              icon={item.icon}
              description={item.description}
              bgImage={item.bgImage}
              href="/journey/basic-config"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
