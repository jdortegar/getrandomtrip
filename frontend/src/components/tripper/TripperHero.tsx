'use client';

import Link from 'next/link';
import { Tripper } from '@/content/trippers';
import { FaWhatsapp } from 'react-icons/fa';

type Props = {
  tripper: Tripper;
};

export default function TripperHero({ tripper }: Props) {
  return (
    <div className="relative h-[60vh] min-h-[400px] bg-gray-800 text-white">
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-4 md:p-8 z-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center mb-4">
            <div className="w-40 h-40 rounded-full bg-gray-700 border-4 border-white shadow-lg"></div>
            <div className="ml-4">
              <h1 className="text-4xl font-bold">{tripper.name}</h1>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="https://wa.me/526241928208"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center"
            >
              <FaWhatsapp className="mr-2" /> Escríbele por WhatsApp
            </Link>
            <Link
              href="#tiers" // Anchor to the tiers section
              className="bg-white text-neutral-900 hover:bg-neutral-100 font-bold py-3 px-6 rounded-lg"
            >
              Diseñar viaje con {tripper.name.split(' ')[0]}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}