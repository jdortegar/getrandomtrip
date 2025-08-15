'use client';
import Image from 'next/image';
import SafeImage from '@/components/SafeImage';

interface ImageMosaicProps {
  type: string;
}

const FOLDER_BY_TYPE: Record<string, string> = {
  couple: 'couples',
  couples: 'couples',
  solo: 'solo',
  family: 'family',
  group: 'group',
  honeymoon: 'honeymoons',
  honeymoons: 'honeymoons',
};



const getPlaceholderImages = (type: string) => {
  const base = '/images/travellers/';
  const folder = FOLDER_BY_TYPE[type] ?? type; // Use the mapper, fallback to type if not found
  return [
    `${base}${folder}/mosaic-1`,
    `${base}${folder}/mosaic-2`,
    `${base}${folder}/mosaic-3`,
    `${base}${folder}/mosaic-4`,
  ];
};

export default function ImageMosaic({ type }: ImageMosaicProps) {
  const images = getPlaceholderImages(type);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
          <SafeImage srcJpg={`${images[0]}.jpg`} srcSvg={`${images[0]}.svg`} alt="Travel image 1" className="object-cover" />
        </div>
        <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg md:col-start-2">
          <SafeImage srcJpg={`${images[1]}.jpg`} srcSvg={`${images[1]}.svg`} alt="Travel image 2" className="object-cover" />
        </div>
        <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg md:col-span-2">
          <SafeImage srcJpg={`${images[2]}.jpg`} srcSvg={`${images[2]}.svg`} alt="Travel image 3" className="object-cover" />
        </div>
        <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
          <SafeImage src={`${images[3]}.jpg`} fallbackSrc={`/images/placeholder-couple.svg`} alt="Travel image 4" className="object-cover" />
        </div>
      </div>
    </section>
  );
}