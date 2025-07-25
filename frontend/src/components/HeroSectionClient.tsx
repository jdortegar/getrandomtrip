'use client';

import PrimaryButton from './PrimaryButton';

interface HeroSectionClientProps {
  title: string;
  subtitle: string;
}

export default function HeroSectionClient({ title, subtitle }: HeroSectionClientProps) {
  return (
    <section className="relative h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-center text-white p-4">
      <div className="z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">{title}</h1>
        <p className="text-xl md:text-2xl mb-8">{subtitle}</p>
        <PrimaryButton onClick={() => console.log('RandomtripME! clicked')}>
          RandomtripME!
        </PrimaryButton>
      </div>
      {/* Background image/gradient can be added here */}
    </section>
  );
}
