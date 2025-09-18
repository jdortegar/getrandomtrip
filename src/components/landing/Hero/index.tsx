'use client';

import React from 'react';
import { HeroVideoBackground } from './HeroVideoBackground';
import { HeroContent } from './HeroContent';
import { HeroScrollIndicator } from './HeroScrollIndicator';

const Hero: React.FC = () => {
  return (
    <section
      id="home-hero"
      className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden"
    >
      {/* <div id="hero-sentinel" className="absolute inset-x-0 top-0 h-4 pointer-events-none" /> */}

      <HeroVideoBackground />
      <HeroContent />

      {/* Scroll Indicator positioned at bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <HeroScrollIndicator />
      </div>
    </section>
  );
};

export default Hero;

// Subcomponents
export { HeroVideoBackground } from './HeroVideoBackground';
export { HeroContent } from './HeroContent';
export { HeroScrollIndicator } from './HeroScrollIndicator';
