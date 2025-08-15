"use client";

import { Tripper } from "@/content/trippers";
import Image from "next/image"; // Assuming AssetImage is a wrapper around Image

type Props = {
  tripper: Tripper;
};

export default function TripperGallery({ tripper }: Props) {
  if (!tripper.gallery || tripper.gallery.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10" id="gallery">
      <h2 className="text-2xl md:text-3xl font-semibold mb-6">Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tripper.gallery.map((imageSrc, index) => (
          <div key={index} className="relative w-full h-60 rounded-lg overflow-hidden shadow-md group">
            <Image
              src={imageSrc}
              alt={`Gallery image ${index + 1}`}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              {/* Optional: Add a view icon or text on hover */}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}