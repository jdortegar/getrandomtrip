import React from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  imageUrl: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, subtitle, imageUrl }) => {
  return (
    <section
      className="relative py-32 bg-cover bg-center flex items-center justify-center text-white overflow-hidden"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div className="absolute inset-0 bg-gray-900 opacity-90"></div> {/* Solid dark background */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Use Playfair Display for title, larger and bolder */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight mb-4 font-serif">
          {title}
        </h1>
        {/* Use Inter for subtitle, with generous letter spacing */}
        <p className="text-lg md:text-xl lg:text-2xl font-light leading-relaxed opacity-90 tracking-wider font-sans">
          {subtitle}
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
