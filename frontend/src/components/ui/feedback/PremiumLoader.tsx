'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PremiumLoaderProps {
  message: string;
}

const PremiumLoader: React.FC<PremiumLoaderProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 border-4 border-t-4 border-gray-600 border-t-[#D4AF37] rounded-full"
    ></motion.div>
    <p
      className="mt-4 text-lg italic"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {message}
    </p>
  </div>
);

export default PremiumLoader;
