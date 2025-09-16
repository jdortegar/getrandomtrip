'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Hero Background Component
const HomeHeroBackground: React.FC = () => {
  const [videoOk, setVideoOk] = useState(false);
  const SRC = '/videos/hero-video.mp4';

  useEffect(() => {
    const video = document.createElement('video');
    video.muted = true;
    video.play().catch(() => {
      console.error('Video playback failed.');
      setVideoOk(false);
    });
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoOk ? 'opacity-100' : 'opacity-0'
        }`}
        poster="/images/bg-playa-mexico.jpg"
        onLoadedData={() => setVideoOk(true)}
        onError={() => setVideoOk(false)}
      >
        {/* IMPORTANT: .webm should be first for better performance/compatibility */}
        <source src={SRC.replace('.mp4', '.webm')} type="video/webm" />{' '}
        {/* Ensure this file exists! */}
        <source src={SRC} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Fallback Image */}
      <div
        className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
          videoOk ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundImage: 'url(/images/bg-playa-mexico.jpg)' }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
};

// Main Hero Component
const Hero: React.FC = () => {
  return (
    <section
      id="home-hero"
      className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden"
    >
      <div
        id="hero-sentinel"
        className="absolute inset-x-0 top-0 h-4 pointer-events-none"
      />

      {/* Fondo con video robusto + poster + fallback */}
      <HomeHeroBackground />

      {/* Contenido del hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <h2
          className="text-4xl md:text-6xl font-bold text-white mb-4"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Serendipia Diseñada.
        </h2>
        <p
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          La espontaneidad es un arte. La improvisación, un riesgo. Abraza la
          autenticidad de lo desconocido.
        </p>
        <p
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Wonder • Wander • Repeat
        </p>
        <Link
          href="/?tab=By%20Traveller#start-your-journey-anchor"
          aria-label="Ir a 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
          className="bg-[#D97E4A] text-white font-bold uppercase tracking-wider py-3 px-8 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111827] focus:ring-[#D4AF37] mt-8 animate-pulse-once"
        >
          RandomtripME!
        </Link>
      </div>

      {/* Indicador de scroll */}
      <style jsx global>{`
        @reference "globals.css";
        @keyframes push-pulse {
          0% {
            transform: scaleY(0.2);
            opacity: 0.8;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
          100% {
            transform: scaleY(0.2);
            opacity: 0.8;
          }
        }
        .scroll-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .scroll-indicator::after {
          content: '';
          display: block;
          width: 2px;
          height: 40px;
          background-color: white;
          margin-top: 0.75rem;
          transform-origin: bottom;
          animation: push-pulse 2s infinite;
        }
      `}</style>
      <div
        className="scroll-indicator pointer-events-none select-none z-10"
        aria-hidden="true"
      >
        SCROLL
      </div>
    </section>
  );
};

export default Hero;
