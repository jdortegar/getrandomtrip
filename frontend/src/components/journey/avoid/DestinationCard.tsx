
'use client';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { AvoidSuggestion } from '@/data/avoid-suggestions';

interface DestinationCardProps {
  dest: AvoidSuggestion;
  isSelected: boolean;
  onToggle: (slug: string) => void;
}

export default function DestinationCard({ dest, isSelected, onToggle }: DestinationCardProps) {
  return (
    <div
      role="button"
      aria-pressed={isSelected}
      onClick={() => onToggle(dest.slug)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle(dest.slug)}
      tabIndex={0}
      className={`relative aspect-[4/5] rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta-500 ${isSelected ? 'ring-2 ring-terracotta-500' : ''}`}
    >
      <Image src={dest.image} alt={dest.name} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      {dest.badge && (
        <span className="absolute top-2 right-2 badge badge-primary bg-blue-500 text-white">{dest.badge}</span>
      )}
      <h3 className="absolute bottom-3 left-3 text-white font-bold text-lg drop-shadow-md">{dest.name}</h3>
      {isSelected && (
        <div className="absolute inset-0 bg-[var(--terracotta,#D97E4A)]/40 flex items-center justify-center">
          <Check className="h-12 w-12 text-white" />
        </div>
      )}
    </div>
  );
}
